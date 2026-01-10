
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
      return onAuthStateChanged(auth, (u: any) => {
        setUser(u as FirebaseUser);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async () => {
    if (!auth) return alert("Firebase not configured.");
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { console.error(e); }
  };

  const signOut = async () => {
    if (auth) await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOfflineMode, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};






