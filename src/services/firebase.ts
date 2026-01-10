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
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
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

// --- INITIALIZATION ---
// Initialize immediately to prevent "null" export errors
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- AUTH ACTIONS ---

export const loginWithGoogle = async (): Promise<AppUser> => {
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
    if (error.code === 'auth/popup-blocked') throw new Error("Sign-in popup was blocked by your browser.");
    if (error.code === 'auth/unauthorized-domain') throw new Error("Domain not authorized in Firebase console.");
    throw error;
  }
};

export const loginAsGuest = async (): Promise<AppUser> => {
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
        console.error("Firebase Anonymous auth failed", e);
        throw e;
    }
};

export const logout = async () => {
  await firebaseSignOut(auth);
};















