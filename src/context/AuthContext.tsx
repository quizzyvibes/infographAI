
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
// @ts-ignore
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseEnabled, diagnoseFirebaseConfig } from '../services/firebase';
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
    // 1. Check for existing Mock Session
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
      // Handle redirect result (for when signInWithRedirect is used)
      getRedirectResult(auth).then((result: any) => {
        if (result?.user) {
          isGuestRef.current = false;
          console.log("Sign-in successful via redirect");
        }
      }).catch((error: any) => {
        console.warn("Redirect login error:", error);
      });

      // @ts-ignore
      const unsubscribe = onAuthStateChanged(auth, (u: any) => {
        if (u) {
          isGuestRef.current = false;
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
    return mockUser;
  };

  const signIn = async () => {
    if (!auth) {
      const report = diagnoseFirebaseConfig();
      alert(`FIREBASE CONNECTION FAILED\n\n${report.join('\n')}`);
      // Fallback
      if (confirm("Would you like to use Mock Login for now?")) {
         createMockUser();
      }
      return;
    }
    
    isGuestRef.current = false;
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      const code = e.code || '';
      console.warn("Login failed:", code, e.message);
      
      // HANDLING "CANCELLED POPUP" / "POPUP BLOCKED"
      if (
          code === 'auth/cancelled-popup-request' || 
          code === 'auth/popup-closed-by-user' || 
          code === 'auth/popup-blocked'
      ) {
          // This usually happens in strict browsers or if the user closes the window.
          // Fallback to Redirect method which is more robust.
          if (confirm("Pop-up sign in was cancelled or blocked by the browser.\n\nClick OK to try signing in via Page Redirect instead (Recommended for Mobile/Chrome).")) {
             try {
                await signInWithRedirect(auth, provider);
             } catch (redirectError: any) {
                alert(`Redirect Login Failed: ${redirectError.message}`);
             }
          }
          return;
      }

      // HANDLING UNAUTHORIZED DOMAIN
      if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-allowed') {
         const domain = window.location.hostname;
         const msg = `GOOGLE LOGIN BLOCKED: UNAUTHORIZED DOMAIN\n\nThe domain "${domain}" is not authorized in your Firebase Console.\n\nTO FIX REAL LOGIN:\n1. Go to Firebase Console > Authentication > Settings > Authorized Domains.\n2. Add "${domain}" to the list.\n\nWould you like to force a Simulated Login for now so you can use the app?`;
         
         if (confirm(msg)) {
            createMockUser();
         }
      } else if (code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
         alert("INVALID API KEY\n\nYour VITE_FIREBASE_API_KEY is incorrect or has expired.");
      } else {
         alert(`Login Error: ${e.message}\nCode: ${code}`);
      }
    }
  };

  const signOut = async () => {
    localStorage.removeItem('infographai_mock_user');
    
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
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOfflineMode, signIn, signOut, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};
