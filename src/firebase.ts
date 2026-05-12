import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBcYdtlPGoxbnyArm-tpdbEIG8al86SUmI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "achievetrack-70086.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://achievetrack-70086-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "achievetrack-70086",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "achievetrack-70086.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "789048838630",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:789048838630:web:e79a205948a860bbd8ae27",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Z0TV9G3CGE"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

export default app;
