
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
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasAuthDomain = !!firebaseConfig.authDomain && firebaseConfig.authDomain.includes('.firebaseapp.com');
export const isFirebaseEnabled = !!firebaseConfig.apiKey && hasAuthDomain;

// Debugging: Log config status
console.log("[Firebase] Config Check:", {
  enabled: isFirebaseEnabled,
  apiKeyPresent: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain ? firebaseConfig.authDomain : "(MISSING or INVALID)",
  projectId: firebaseConfig.projectId
});

// HELP THE USER FIX AUTH ERRORS
if (typeof window !== 'undefined') {
  console.log("%c[Firebase] ADD THIS DOMAIN TO AUTH:", "background: #222; color: #bada55; font-size: 14px");
  console.log(window.location.hostname);
  console.log("Go to Firebase Console > Authentication > Settings > Authorized Domains and add the URL above.");
}

if (!hasAuthDomain && !!firebaseConfig.apiKey) {
  console.error("CRITICAL: VITE_FIREBASE_AUTH_DOMAIN is missing or malformed in .env file. Auth will fail.");
}

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





