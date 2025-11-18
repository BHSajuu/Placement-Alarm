
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "Placement Alarm";
    const body = data.body || "You have a new notification";
    const icon = data.icon || "/logo1.png";
    const url = data.url || "/";

    const options = {
      body: body,
      icon: icon,
      badge: icon, // Small icon for the notification bar (Android)
      data: { url: url }, // Store the URL to open on click
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error("Error handling push event:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});