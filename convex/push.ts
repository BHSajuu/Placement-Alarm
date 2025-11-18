
"use node"; 

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

export const sendPush = action({
  args: {
    userId: v.string(),
    message: v.string(),
    link: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Check Cron Secret (Security)
    const cronSecret = process.env.CRON_SECRET; 
    if (!cronSecret) {
      throw new Error("CRON_SECRET environment variable is not set in Convex.");
    }
    
    // 2. Log the in-app notification (Database)
    // We call the mutation from the OTHER file here
    await ctx.runMutation(internal.notifications.logNotification, {
      userId: args.userId,
      message: args.message,
      link: args.link,
    });

    // 3. Send Web Push Notification
    try {
      // Fetch the user's subscription securely
      const profile = await ctx.runQuery(internal.profiles.getProfileForPush, { 
        userId: args.userId 
      });

      if (profile?.subscription) {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT!,
          process.env.VAPID_PUBLIC_KEY!,
          process.env.VAPID_PRIVATE_KEY!
        );

        const payload = JSON.stringify({
          title: "Placement Alarm",
          body: args.message,
          url: args.link,
          icon: "/logo1.png" 
        });

        try {
          await webpush.sendNotification(profile.subscription, payload);
          console.log(`Push notification sent to ${args.userId}`);
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
             console.log("Subscription expired or invalid.");
          } else {
            console.error("Error sending push notification:", err);
          }
        }
      }
    } catch (error) {
      console.error("Failed to process push notification logic:", error);
    }
  },
});