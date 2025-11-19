

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received."); // This will show in the SW console
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (err) {
    console.error("[Service Worker] Error parsing JSON:", err);
    // Fallback for testing text-only pushes
    data = { title: "Placement Alarm", body: event.data.text() };
  }

  const title = data.title || "Placement Alarm";
  const body = data.body || "You have a new notification";
  const icon = data.icon || "/logo1.png"; 
  const url = data.url || "/";

  const options = {
    body: body,
    icon: icon,
    badge: icon,
    data: { url: url },
    // These options help ensure visibility on some devices
    requireInteraction: true, // Keeps notification on screen until user clicks
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
    .catch(err => console.error("[Service Worker] Error showing notification:", err))
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click received.");
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});