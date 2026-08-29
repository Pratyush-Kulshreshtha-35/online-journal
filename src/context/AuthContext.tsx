import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile } from '../types/journal';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Sync user profile in Firestore
  const syncUserProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Journaler' : 'Journaler'),
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          streakCount: 0,
          lastJournalDate: null,
          createdAt: Date.now(),
        };

        await setDoc(userRef, {
          ...newProfile,
          serverCreatedAt: serverTimestamp(),
        });
        setProfile(newProfile);
      } else {
        const data = userSnap.data();
        setProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: data.displayName || firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Journaler' : 'Journaler'),
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          streakCount: data.streakCount || 0,
          lastJournalDate: data.lastJournalDate || null,
          createdAt: data.createdAt || Date.now(),
        });
      }
    } catch (err: any) {
      console.warn('Error syncing profile document:', err);
      // Fallback local profile if Firestore sync faces temporary latency
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Journaler' : 'Journaler'),
        photoURL: firebaseUser.photoURL,
        isAnonymous: firebaseUser.isAnonymous,
        streakCount: 0,
        lastJournalDate: null,
        createdAt: Date.now(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await syncUserProfile(user);
    }
  };

  const signInWithGoogleHandler = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      // Normal user dismissal or permission cancellation shouldn't throw error warnings
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/user-cancelled' ||
        code === 'auth/cancelled-popup-request'
      ) {
        console.info('Google sign-in popup was closed or cancelled by the user.');
        return;
      }

      if (code === 'auth/popup-blocked') {
        console.warn('Google sign-in popup was blocked by browser.');
        setError('Popup was blocked by your browser. Please allow popups or try guest sign-in.');
        return;
      }

      if (code === 'auth/unauthorized-domain') {
        console.warn('Firebase unauthorized domain:', window.location.hostname);
        setError('Domain not authorized in Firebase. You can continue using Guest mode or Email/Password.');
        return;
      }

      console.error('Google Sign-In Error:', err);
      setError(err?.message || 'Failed to sign in with Google.');
    }
  };

  const signInWithEmailHandler = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Access temporarily disabled due to many failed attempts. Try again later.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        console.warn('Email Sign-In Error:', err);
        setError(err.message || 'Failed to sign in.');
      }
      throw err;
    }
  };

  const signUpWithEmailHandler = async (email: string, pass: string, name: string) => {
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user && name.trim()) {
        await updateProfile(res.user, { displayName: name.trim() });
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        console.warn('Sign Up Error:', err);
        setError(err.message || 'Failed to create account.');
      }
      throw err;
    }
  };

  const signInAsGuestHandler = async () => {
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError('Guest sign-in is not enabled in Firebase Console.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        console.warn('Anonymous Sign-In Error:', err);
        setError(err.message || 'Failed to initialize guest session.');
      }
      throw err;
    }
  };

  const logoutHandler = async () => {
    setError(null);
    try {
      await signOut(auth);
      setProfile(null);
    } catch (err: any) {
      console.error('Logout Error:', err);
      setError(err.message || 'Failed to sign out.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        signInWithGoogle: signInWithGoogleHandler,
        signInWithEmail: signInWithEmailHandler,
        signUpWithEmail: signUpWithEmailHandler,
        signInAsGuest: signInAsGuestHandler,
        logout: logoutHandler,
        clearError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
