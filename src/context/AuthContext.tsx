
import React, { createContext, useContext, useEffect, useState } from 'react';
// @ts-ignore
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseEnabled } from '../services/firebase';
import { FirebaseUser } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isOfflineMode: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isOfflineMode = !isFirebaseEnabled;

  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      // @ts-ignore
      const unsubscribe = onAuthStateChanged(auth, (u: any) => {
        setUser(u as FirebaseUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async () => {
    if (!auth) {
      alert("Firebase not configured properly. Check your API Keys.");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error("Firebase Login Error Full Object:", e);
      // Detailed error reporting for the user
      const code = e.code || 'unknown-error';
      const message = e.message || 'An unknown error occurred';
      
      let helpText = "";
      if (code === 'auth/operation-not-allowed') {
        helpText = "\n\nSOLUTION: Go to Firebase Console > Authentication > Sign-in method and ENABLE 'Google'.";
      } else if (code === 'auth/unauthorized-domain') {
        helpText = "\n\nSOLUTION: Go to Firebase Console > Authentication > Settings > Authorized Domains and add this domain.";
      } else if (code === 'auth/api-key-not-valid') {
        helpText = "\n\nSOLUTION: Your API Key in .env is invalid or deleted in Google Cloud Console.";
      }

      alert(`Login Failed: ${message} (${code})${helpText}`);
    }
  };

  const signOut = async () => {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.error("Sign out error", e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOfflineMode, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};


