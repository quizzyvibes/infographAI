
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAuth } from "firebase/auth";
// @ts-ignore
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import { getStorage } from "firebase/storage";

// --- CONFIGURATION ---

// Robust helper to get env var from either import.meta.env (Vite) or process.env (Vercel/Node)
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
     // @ts-ignore
     return (import.meta as any).env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
     // @ts-ignore
     return process.env[key];
  }
  return "";
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Console check to assist debugging (Keys masked for security)
console.log("Firebase Config Status:", {
  hasApiKey: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

export const isFirebaseEnabled = !!firebaseConfig.apiKey && !!firebaseConfig.authDomain;

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
  console.warn("Firebase config missing. Running in offline/demo mode.");
}

export { auth, db, storage };

