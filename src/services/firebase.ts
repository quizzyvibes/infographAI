

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Load configuration from environment variables (SECURE)
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if keys are loaded
const isKeyMissing = !firebaseConfig.apiKey || !firebaseConfig.projectId;

if (isKeyMissing) {
  console.warn("Firebase Config is missing. Ensure you have a .env file with VITE_FIREBASE_... keys.");
}

export let isFirebaseEnabled = !isKeyMissing;

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
    console.log("[Firebase] Initialized securely.");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    isFirebaseEnabled = false; 
  }
}

export { auth, db, storage };
