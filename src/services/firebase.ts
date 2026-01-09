
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
// This is critical. Do not iterate over env object.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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



