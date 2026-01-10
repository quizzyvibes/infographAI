import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, loginAsGuest, logout } from '../services/firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  handleGuestLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Single source of truth: Firebase Auth State
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({
          uid: u.uid,
          displayName: u.displayName || (u.isAnonymous ? "Guest Explorer" : "User"),
          email: u.email,
          photoURL: u.photoURL,
          isGuest: u.isAnonymous,
          metadata: {
            creationTime: u.metadata?.creationTime,
            lastSignInTime: u.metadata?.lastSignInTime
          }
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await loginWithGoogle();
    } catch (e: any) {
      console.error("Login process failed", e);
      alert(e.message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
    } catch (e) {
      alert("Guest login failed. Please try again.");
    }
  };

  const signOut = async () => {
    try {
      await logout();
      setUser(null);
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, handleGuestLogin }}>
      {children}
    </AuthContext.Provider>
  );
};








