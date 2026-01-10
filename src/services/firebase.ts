
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { AppUser } from "../types";

// --- CONFIGURATION ---

// Robust helper to get env var (Matches QuizzyVibes working config)
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
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID')
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
    // Explicitly set language code if possible
    if (auth.useDeviceLanguage) {
        auth.useDeviceLanguage(); 
    }
    
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("[Firebase] Initialized successfully");
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
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    console.log("Attempting signInWithPopup...");
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
    // If auth is available, try anonymous login
    if (auth) {
        try {
            const result = await signInAnonymously(auth);
            const u = result.user;
            return {
                uid: u.uid,
                displayName: "Guest Explorer",
                email: null,
                photoURL: null,
                isGuest: true,
                metadata: {
                    creationTime: u.metadata?.creationTime,
                    lastSignInTime: u.metadata?.lastSignInTime
                }
            };
        } catch (e) {
            console.warn("Anonymous auth failed, falling back to local guest", e);
        }
    }

    // Fallback if Firebase is offline
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













