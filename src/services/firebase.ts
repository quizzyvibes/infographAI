
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAuth } from "firebase/auth";
// @ts-ignore
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import { getStorage } from "firebase/storage";

// --- CONFIGURATION ---

// Explicitly access import.meta.env variables for Vite static replacement
const VITE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const VITE_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const VITE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const VITE_STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const VITE_MESSAGING_SENDER_ID = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const VITE_APP_ID = import.meta.env.VITE_FIREBASE_APP_ID;

// Helper to fallback to process.env (for non-Vite environments)
const getEnv = (viteVal: string | undefined, key: string) => {
  if (viteVal) return viteVal;
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
     // @ts-ignore
     return process.env[key];
  }
  return "";
};

const firebaseConfig = {
  apiKey: getEnv(VITE_API_KEY, 'VITE_FIREBASE_API_KEY'),
  authDomain: getEnv(VITE_AUTH_DOMAIN, 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv(VITE_PROJECT_ID, 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv(VITE_STORAGE_BUCKET, 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv(VITE_MESSAGING_SENDER_ID, 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv(VITE_APP_ID, 'VITE_FIREBASE_APP_ID')
};

export const isFirebaseEnabled = !!firebaseConfig.apiKey && !!firebaseConfig.authDomain;

// Debugging: Log config status (masked)
console.log("[Firebase] Config Check:", {
  enabled: isFirebaseEnabled,
  apiKeyPresent: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

let app;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (isFirebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("[Firebase] Initialized successfully.");
  } catch (error) {
    console.error("CRITICAL: Firebase Init Failed", error);
  }
} else {
  console.warn("Firebase config missing. App running in offline/demo mode.");
}

export { auth, db, storage };


