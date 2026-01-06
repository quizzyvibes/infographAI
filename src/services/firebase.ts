import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFvAEMNIZcOO-2tYL-gT5Xvho0i7QAIm4",
  authDomain: "infographai-f08d6.firebaseapp.com",
  projectId: "infographai-f08d6",
  storageBucket: "infographai-f08d6.firebasestorage.app",
  messagingSenderId: "847656531274",
  appId: "1:847656531274:web:ca9758ce2d9ef189303db3",
  measurementId: "G-650CD1KMQG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
