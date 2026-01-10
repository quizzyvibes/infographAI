import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseEnabled, loginWithGoogle, loginAsGuest, logout, diagnoseFirebaseConfig } from '../services/firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isOfflineMode: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isGuestRef = useRef(false);
  const isOfflineMode = !isFirebaseEnabled;

  useEffect(() => {
    // 1. Check for existing Mock/Guest Session
    const storedMockUser = localStorage.getItem('infographai_mock_user');
    if (storedMockUser) {
      try {
        const parsed = JSON.parse(storedMockUser);
        setUser(parsed);
        if (parsed.isGuest) isGuestRef.current = true;
      } catch (e) {
        localStorage.removeItem('infographai_mock_user');
      }
    }

    // 2. Check Real Firebase Auth
    if (isFirebaseEnabled && auth) {
      const unsubscribe = onAuthStateChanged(auth, (u: any) => {
        if (u) {
          isGuestRef.current = false;
          localStorage.removeItem('infographai_mock_user');
          setUser({
            uid: u.uid,
            displayName: u.displayName,
            email: u.email,
            photoURL: u.photoURL,
            isGuest: false,
            metadata: {
              creationTime: u.metadata?.creationTime,
              lastSignInTime: u.metadata?.lastSignInTime
            }
          });
        } else {
          if (!isGuestRef.current && !localStorage.getItem('infographai_mock_user')) {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const handleGuestLogin = async () => {
    isGuestRef.current = true;
    try {
      const u = await loginAsGuest();
      setUser(u);
    } catch (e) {
      console.error("Guest login failed", e);
    }
  };

  const signIn = async () => {
    if (!auth) {
      const report = diagnoseFirebaseConfig();
      console.error("Firebase Config Report:", report);
      alert("Login unavailable: Firebase modules not loaded. Continuing as guest.");
      handleGuestLogin();
      return;
    }
    
    try {
      await loginWithGoogle();
    } catch (e: any) {
      console.error("Google Login Error:", e);
      if (confirm(`Login Failed: ${e.message}\n\nContinue in Guest Mode instead?`)) {
          handleGuestLogin();
      }
    }
  };

  const signOut = async () => {
    await logout();
    setUser(null);
    isGuestRef.current = false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOfflineMode, signIn, signOut, loginAsGuest: handleGuestLogin }}>
      {children}
    </AuthContext.Provider>
  );
};









