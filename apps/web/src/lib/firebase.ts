import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCm6_ZWEnA__kv_8HZ0HwaJdsikXFxetN0",
  authDomain: "balochi-bazzar.firebaseapp.com",
  projectId: "balochi-bazzar",
  storageBucket: "balochi-bazzar.firebasestorage.app",
  messagingSenderId: "412467610337",
  appId: "1:412467610337:web:3c31d11fe2f52eb73b2da0",
  measurementId: "G-JSZVY3G9TS"
};

import { getAuth } from "firebase/auth";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Analytics is only initialized on client-side (window undefined check)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export const auth = getAuth(app);

export default app;
