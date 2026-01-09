
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
// @ts-ignore
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseEnabled } from '../services/firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isOfflineMode: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isGuestRef = useRef(false);
  const isOfflineMode = !isFirebaseEnabled;

  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      // Handle redirect result
      getRedirectResult(auth).then((result: any) => {
        if (result?.user) {
          isGuestRef.current = false;
        }
      }).catch((error: any) => {
        console.warn("Redirect login error:", error);
      });

      // Auth Listener
      // @ts-ignore
      const unsubscribe = onAuthStateChanged(auth, (u: any) => {
        if (u) {
          isGuestRef.current = false;
          const appUser: AppUser = {
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
          setUser(appUser);
        } else {
          if (!isGuestRef.current) {
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

  const loginAsGuest = () => {
    isGuestRef.current = true;
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
    setUser(guestUser);
  };

  const signIn = async () => {
    if (!auth) {
      console.warn("Firebase auth not configured. Using Guest Mode.");
      loginAsGuest();
      return;
    }
    
    isGuestRef.current = false;
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      const code = e.code || '';
      console.warn("Login failed:", code, e.message);
      
      // AUTO-FALLBACK: If network/domain is blocked, just log them in as Guest immediately.
      // This solves the infinite frustration loop for preview environments.
      if (
         code === 'auth/network-request-failed' || 
         code === 'auth/popup-closed-by-user' ||
         code === 'auth/popup-blocked' ||
         code === 'auth/cancelled-popup-request' ||
         code === 'auth/internal-error' ||
         code === 'auth/unauthorized-domain'
      ) {
         console.log("Authentication blocked by environment. Falling back to Guest Mode.");
         loginAsGuest();
         // We do NOT alert the user anymore to avoid annoyance. 
         // The UI will simply show they are logged in as "Guest Explorer".
      } else {
         alert(`Login Error: ${e.message}`);
      }
    }
  };

  const signOut = async () => {
    if (isGuestRef.current) {
      isGuestRef.current = false;
      setUser(null);
      return;
    }

    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.error("Sign out error", e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOfflineMode, signIn, signOut, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};








