
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
// @ts-ignore
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import { getStorage } from "firebase/storage";
import { AppUser } from "../types";

// --- CONFIGURATION ---

// Helper to clean env vars
const cleanVar = (val: string | undefined) => val ? val.trim().replace(/['";]/g, '') : "";

// Explicitly access import.meta.env variables for Vite static replacement
const firebaseConfig = {
  apiKey: cleanVar(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: cleanVar(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanVar(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanVar(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanVar(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanVar(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: cleanVar(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID)
};

export const isFirebaseEnabled = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// --- DIAGNOSTIC TOOL ---
export const diagnoseFirebaseConfig = () => {
  const report: string[] = [];
  const domain = window.location.hostname;

  if (!firebaseConfig.apiKey) report.push("CRITICAL: 'VITE_FIREBASE_API_KEY' is missing.");
  if (!firebaseConfig.authDomain) report.push("CRITICAL: 'VITE_FIREBASE_AUTH_DOMAIN' is missing.");
  if (!firebaseConfig.projectId) report.push("CRITICAL: 'VITE_FIREBASE_PROJECT_ID' is missing.");
  
  report.push("--- DOMAIN CHECK ---");
  report.push(`Current Domain: ${domain}`);
  report.push(`Authorized Auth Domain: ${firebaseConfig.authDomain}`);
  report.push("Action: Ensure current domain is added in Firebase Console > Authentication > Settings > Authorized Domains.");
  
  return report;
};

let app;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (isFirebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Explicitly set language code if possible, or leave default
    auth.useDeviceLanguage(); 
    
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("[Firebase] Initialized successfully with Auth Domain:", firebaseConfig.authDomain);
  } catch (error) {
    console.error("CRITICAL: Firebase Init Failed", error);
  }
} else {
  console.warn("Firebase config missing. App running in offline/demo mode.");
  console.log("Config State:", firebaseConfig); 
}

// --- AUTH ACTIONS ---

export const loginWithGoogle = async (): Promise<AppUser> => {
  if (!auth) throw new Error("Firebase Auth not initialized. Check API Keys.");

  const provider = new GoogleAuthProvider();
  // Force account selection to ensure a fresh token flow if needed
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    console.log("Attempting signInWithPopup...");
    // Attempt standard popup login
    const result = await signInWithPopup(auth, provider);
    const u = result.user;
    
    return {
      uid: u.uid,
      displayName: u.displayName,
      email: u.email,
      photoURL: u.photoURL,
      isGuest: false,
      metadata: {
        creationTime: u.metadata?.creationTime,
        lastSignInTime: u.metadata?.lastSignInTime
      }
    };
  } catch (error: any) {
    console.error("Google Login Error:", error);
    
    if (error.code === 'auth/popup-blocked') {
        throw new Error("Popup blocked. Please allow popups for this site and try again.");
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("Login cancelled.");
    }

    if (error.code === 'auth/unauthorized-domain') {
       throw new Error(`Domain not authorized: ${window.location.hostname}. Please add it to Firebase Console.`);
    }
    
    throw error;
  }
};

export const loginAsGuest = async (): Promise<AppUser> => {
    const guestUser: AppUser = {
      uid: `guest_${Date.now()}`,
      displayName: "Guest Explorer",
      email: null,
      photoURL: null,
      isGuest: true,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    };
    localStorage.setItem('infographai_mock_user', JSON.stringify(guestUser));
    return guestUser;
};

export const logout = async () => {
  if (auth) {
    await firebaseSignOut(auth);
  }
  localStorage.removeItem('infographai_mock_user');
};

export { auth, db, storage };











