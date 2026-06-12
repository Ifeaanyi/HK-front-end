importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAfCZX886yOJIyfFPEiRTKdRxsvAepYtg4",
  authDomain: "habit-king-app.firebaseapp.com",
  projectId: "habit-king-app",
  storageBucket: "habit-king-app.firebasestorage.app",
  messagingSenderId: "670081196847",
  appId: "1:670081196847:web:9b5a311145a2cc162d37da",
});

const messaging = firebase.messaging();

// Fires when a notification arrives and the app is CLOSED or in the background
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Habit King";
  const options = {
    body: payload.notification?.body || "",
    icon: "/logo.png",
    badge: "/logo.png",
  };
  self.registration.showNotification(title, options);
});