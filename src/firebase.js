import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAfCZX886yOJIyfFPEiRTKdRxsvAepYtg4",
  authDomain: "habit-king-app.firebaseapp.com",
  projectId: "habit-king-app",
  storageBucket: "habit-king-app.firebasestorage.app",
  messagingSenderId: "670081196847",
  appId: "1:670081196847:web:9b5a311145a2cc162d37da",
};

const VAPID_KEY =
  "BL5VV6NzgVp7laAT8EOnezSlu_TNCi1Nxxh8g_1MFGdikHXO5WKR_fnnzwCu7pTaCqH7gMJ1Ipy3PlEFuNbfzgI";

const app = initializeApp(firebaseConfig);

// Messaging is not supported in all browsers (e.g. older Safari).
// This guard stops the whole app crashing on unsupported devices.
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn("Push notifications not supported on this browser");
}

// Asks the user for permission and returns their device token (or null)
export async function requestNotificationPermission() {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token || null;
  } catch (err) {
    console.warn("Could not get notification token:", err);
    return null;
  }
}

// Handles notifications that arrive while the app is OPEN in the foreground
export function onForegroundMessage(callback) {
  if (!messaging) return;
  onMessage(messaging, callback);
}