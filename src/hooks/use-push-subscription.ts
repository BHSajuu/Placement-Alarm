
"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { urlBase64ToUint8Array } from "@/lib/utils";
import toast from "react-hot-toast";

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  
  const saveSubscription = useMutation(api.profiles.savePushSubscription);

  useEffect(() => {
    // Check if browser supports service workers and push
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      // Check if already subscribed
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        setSubscription(sub);
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  async function subscribeToPush(userId: string) {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      setSubscription(sub);

      // Serialize the subscription object to JSON so we can send it to Convex
      const subJson = JSON.parse(JSON.stringify(sub));
      
      await saveSubscription({
        userId,
        subscription: {
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          }
        }
      });

      toast.success("Notifications enabled!");
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Failed to enable notifications. Please check permissions.");
    }
  }

  return { isSupported, subscription, subscribeToPush };
}