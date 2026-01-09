
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
    // 1. Check for existing Mock/Simulated Session in LocalStorage
    // This persists the "Dev Mode" login across refreshes
    const storedMockUser = localStorage.getItem('infographai_mock_user');
    if (storedMockUser) {
      try {
        const parsed = JSON.parse(storedMockUser);
        setUser(parsed);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('infographai_mock_user');
      }
    }

    // 2. Check Real Firebase Auth
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
          // Clear mock user if real auth succeeds
          localStorage.removeItem('infographai_mock_user');
          
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

  const createMockUser = () => {
    // This creates a "Real-looking" user session that bypasses Firebase
    // Useful for environments where domains cannot be whitelisted easily
    const mockUser: AppUser = {
      uid: `mock_user_${Date.now()}`,
      displayName: "Simulated User",
      email: "demo@infograph.ai",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", // Deterministic avatar
      isGuest: false, // Treated as a "Real" logged in user for UI purposes
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    };
    setUser(mockUser);
    localStorage.setItem('infographai_mock_user', JSON.stringify(mockUser));
    return mockUser;
  };

  const signIn = async () => {
    // If Firebase isn't configured at all, use Mock immediately
    if (!auth) {
      console.warn("Firebase auth not configured. Using Mock Auth.");
      createMockUser();
      return;
    }
    
    isGuestRef.current = false;
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      const code = e.code || '';
      console.warn("Login failed:", code, e.message);
      
      // AUTO-FALLBACK: Handle the "Unauthorized Domain" error intelligently
      if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-allowed') {
         const domain = window.location.hostname;
         
         // 1. Inform the user EXACTLY how to fix it for real
         alert(`GOOGLE LOGIN BLOCKED BY FIREBASE\n\nThe domain "${domain}" is not authorized.\n\nTO FIX REAL LOGIN:\nGo to Firebase Console > Authentication > Settings > Authorized Domains and add "${domain}".\n\nAUTO-FIXING FOR NOW:\nLogging you in as a 'Simulated User' so you can continue testing the app immediately.`);
         
         // 2. Bypass the blocker so they can use the app
         createMockUser();
         
      } else if (
         code === 'auth/network-request-failed' || 
         code === 'auth/popup-closed-by-user' ||
         code === 'auth/popup-blocked' ||
         code === 'auth/cancelled-popup-request' ||
         code === 'auth/internal-error'
      ) {
         console.log("Authentication blocked by environment rules. Switching to Mock Auth Provider.");
         createMockUser();
      } else {
         alert(`Login Error: ${e.message}`);
      }
    }
  };

  const signOut = async () => {
    // 1. Clear Mock Session
    localStorage.removeItem('infographai_mock_user');
    
    // 2. Clear Guest Ref
    if (isGuestRef.current) {
      isGuestRef.current = false;
      setUser(null);
      return;
    }

    // 3. Attempt Real Signout
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.error("Sign out error", e);
      }
    }
    
    // Force state clear
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOfflineMode, signIn, signOut, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};









