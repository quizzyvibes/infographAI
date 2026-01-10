
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
// @ts-ignore
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth, isFirebaseEnabled, loginWithGoogle, logout, diagnoseFirebaseConfig } from '../services/firebase';
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
      // Check for redirect result (mobile flow)
      getRedirectResult(auth).then((result: any) => {
        if (result?.user) {
           console.log("Restored from redirect login");
        }
      }).catch((e: any) => console.error("Redirect check failed", e));

      // @ts-ignore
      const unsubscribe = onAuthStateChanged(auth, (u: any) => {
        if (u) {
          isGuestRef.current = false;
          // Clear mock data if real user logs in
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
          // If no real user and not a guest, clear state
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
    localStorage.setItem('infographai_mock_user', JSON.stringify(guestUser));
  };

  const createMockUser = () => {
    const mockUser: AppUser = {
      uid: `mock_user_${Date.now()}`,
      displayName: "Simulated User",
      email: "demo@infograph.ai",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
      isGuest: false, 
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    };
    setUser(mockUser);
    localStorage.setItem('infographai_mock_user', JSON.stringify(mockUser));
  };

  const signIn = async () => {
    if (!auth) {
      const report = diagnoseFirebaseConfig();
      const msg = `FIREBASE CONFIG ERROR\n\n${report.join('\n')}`;
      console.error(msg);
      alert("Login unavailable: Firebase is not configured correctly. Check console for details.");
      
      if (confirm("Run in Simulation Mode?")) {
         createMockUser();
      }
      return;
    }
    
    isGuestRef.current = false;
    
    try {
      await loginWithGoogle();
      // The onAuthStateChanged listener will handle the state update
    } catch (e: any) {
      console.error("Sign in failed", e);
      let errorMsg = e.message || "Unknown error";
      
      if (e.code === 'auth/unauthorized-domain') {
         errorMsg = "Domain not authorized. Please add this domain in Firebase Console > Auth > Settings.";
      } else if (e.code === 'auth/operation-not-supported-in-this-environment') {
         errorMsg = "Login not supported in this specific browser environment. Try Chrome or Safari.";
      } else if (e.message.includes("invalid")) {
         errorMsg = "Invalid API Configuration. Check VITE_FIREBASE_API_KEY in your .env file.";
      }

      alert(`Login Error: ${errorMsg}`);
    }
  };

  const signOut = async () => {
    await logout();
    setUser(null);
    isGuestRef.current = false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOfflineMode, signIn, signOut, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};





