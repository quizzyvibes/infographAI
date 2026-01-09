
import React, { createContext, useContext, useEffect, useState } from 'react';
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
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isOfflineMode = !isFirebaseEnabled;

  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      // Check for redirect result on load (handles the fallback login flow)
      getRedirectResult(auth).then((result: any) => {
        if (result?.user) {
          console.log("Redirect login successful");
        }
      }).catch((error: any) => {
        console.error("Redirect login error:", error);
      });

      // Listen for auth state changes
      // @ts-ignore
      const unsubscribe = onAuthStateChanged(auth, (u: any) => {
        if (u) {
          // Explicitly map ONLY the fields we need to avoid "Type 'User' is missing..." errors
          // This creates a clean AppUser object that TypeScript is happy with.
          const appUser: AppUser = {
            uid: u.uid,
            displayName: u.displayName,
            email: u.email,
            photoURL: u.photoURL,
            metadata: {
              creationTime: u.metadata?.creationTime,
              lastSignInTime: u.metadata?.lastSignInTime
            }
          };
          setUser(appUser);
        } else {
          setUser(null);
        }
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
    const provider = new GoogleAuthProvider();
    
    try {
      // First try popup
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.warn("Popup login failed, attempting redirect fallback...", e);
      const code = e.code || '';
      
      // If popup was closed by user or blocked, fallback to redirect
      if (code === 'auth/popup-closed-by-user' || code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
         try {
            await signInWithRedirect(auth, provider);
            return; // Redirecting...
         } catch (redirectError: any) {
            console.error("Redirect login also failed", redirectError);
            alert(`Login Failed: ${redirectError.message}`);
         }
      } else {
         // Handle configuration errors
         let helpText = "";
         if (code === 'auth/operation-not-allowed') {
           helpText = "\n\nSOLUTION: Go to Firebase Console > Authentication > Sign-in method and ENABLE 'Google'.";
         } else if (code === 'auth/unauthorized-domain') {
           helpText = "\n\nSOLUTION: Go to Firebase Console > Authentication > Settings > Authorized Domains and add this domain.";
         } else if (code === 'auth/api-key-not-valid') {
           helpText = "\n\nSOLUTION: Your API Key in .env is invalid.";
         }
         alert(`Login Failed: ${e.message} (${code})${helpText}`);
      }
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




