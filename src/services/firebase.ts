
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDyG2fjs_y7SzAtQmN2w_ybNDYPKHKnFyE",
  authDomain: "infoai-2323b.firebaseapp.com",
  projectId: "infoai-2323b",
  storageBucket: "infoai-2323b.firebasestorage.app",
  messagingSenderId: "921050903472",
  appId: "1:921050903472:web:b49d950530649b947a5c75"
};

// Simple check to ensure keys are present
const isKeyMissing = !firebaseConfig.apiKey || !firebaseConfig.projectId;

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
    console.log("[Firebase] Initialized successfully with project:", firebaseConfig.projectId);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    isFirebaseEnabled = false; 
  }
} else {
  console.warn("Firebase Config is missing. App running in Local-Only mode.");
}

export { auth, db, storage };
