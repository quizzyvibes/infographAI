
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { AppUser } from "../types";

// --- CONFIGURATION ---

const getEnv = (key: string) => {
  // Check import.meta.env for Vite
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    if ((import.meta as any).env[key]) return (import.meta as any).env[key];
  }
  // Check process.env for standard Node/Babel
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
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
  
  return report;
};

let auth: any = null;
let db: any = null;
let storage: any = null;

if (isFirebaseEnabled) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("[Firebase] Modules Initialized");
  } catch (error) {
    console.error("Firebase Init Failed", error);
  }
}

// --- AUTH ACTIONS ---

export const loginWithGoogle = async (): Promise<AppUser> => {
  if (!auth) throw new Error("Firebase Auth not initialized.");

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  try {
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
    if (error.code === 'auth/popup-blocked') throw new Error("Popup blocked by browser.");
    if (error.code === 'auth/unauthorized-domain') throw new Error(`Domain ${window.location.hostname} not authorized in Firebase.`);
    throw error;
  }
};

export const loginAsGuest = async (): Promise<AppUser> => {
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
            console.warn("Anonymous auth failed, using local session", e);
        }
    }

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
  if (auth) await firebaseSignOut(auth);
  localStorage.removeItem('infographai_mock_user');
};

export { auth, db, storage };















