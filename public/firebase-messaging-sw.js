importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Take control immediately when a new version deploys (auto-update for users)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

firebase.initializeApp({
  apiKey: "AIzaSyAfCZX886yOJIyfFPEiRTKdRxsvAepYtg4",
  authDomain: "habit-king-app.firebaseapp.com",
  projectId: "habit-king-app",
  storageBucket: "habit-king-app.firebasestorage.app",
  messagingSenderId: "670081196847",
  appId: "1:670081196847:web:9b5a311145a2cc162d37da",
});

const messaging = firebase.messaging();

// Fires when a message arrives and the app is CLOSED or in the background.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "Habit King";
  const options = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/logo.png",
    tag: "habit-king",
    data: { url: payload.data?.url || "https://habitking.io/dashboard" },
  };
  self.registration.showNotification(title, options);
});

// When a user taps a notification, open the app to the right page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || 'https://habitking.io/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(targetUrl);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});