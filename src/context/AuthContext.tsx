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

export interface RefererBlockInfo {
  blockedOrigin: string;
  allowedPattern: string;
  gcpConsoleUrl: string;
  rawMessage?: string;
  rawCode?: string;
  keySuffix?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refererBlockInfo: RefererBlockInfo | null;
  isLocalMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  startLocalSession: () => void;
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
  const [refererBlockInfo, setRefererBlockInfo] = useState<RefererBlockInfo | null>(null);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false);

  const clearError = () => {
    setError(null);
    setRefererBlockInfo(null);
  };

  const startLocalSession = () => {
    clearError();
    const storedUid =
      localStorage.getItem('journal_local_uid') ||
      `local_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('journal_local_uid', storedUid);
    localStorage.setItem('journal_local_session', 'true');

    const localUser = {
      uid: storedUid,
      email: null,
      displayName: 'Mindful Journaler',
      photoURL: null,
      isAnonymous: true,
    } as unknown as User;

    const localProfile: UserProfile = {
      uid: storedUid,
      email: null,
      displayName: 'Mindful Journaler (Private Sanctuary)',
      photoURL: null,
      isAnonymous: true,
      streakCount: 1,
      lastJournalDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
    };

    setUser(localUser);
    setProfile(localProfile);
    setIsLocalMode(true);
    setLoading(false);
  };

  // Sync user profile in Firestore
  const syncUserProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName:
            firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Journaler' : 'Journaler'),
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
          displayName:
            data.displayName ||
            firebaseUser.displayName ||
            (firebaseUser.isAnonymous ? 'Guest Journaler' : 'Journaler'),
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          streakCount: data.streakCount || 0,
          lastJournalDate: data.lastJournalDate || null,
          createdAt: data.createdAt || Date.now(),
        });
      }
    } catch (err: any) {
      console.warn('Notice syncing profile with Firestore:', err?.message || err);
      // Fallback local profile if Firestore sync faces temporary latency or rules
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName:
          firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Journaler' : 'Journaler'),
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
      if (currentUser) {
        setUser(currentUser);
        setIsLocalMode(false);
        await syncUserProfile(currentUser);
      } else {
        // Automatically start local sanctuary mode so application is instantly interactive
        // and displays the 30-day journal entries and mood trendline immediately
        startLocalSession();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user && !isLocalMode) {
      await syncUserProfile(user);
    }
  };

  const signInWithGoogleHandler = async () => {
    clearError();
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      console.warn('Google Sign-In notice:', { code, msg, err });

      // User closed popup
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/user-cancelled' ||
        code === 'auth/cancelled-popup-request'
      ) {
        console.info('Google sign-in popup was closed by user.');
        return;
      }

      if (code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups or open the app in a new tab.');
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        setError(
          'Google Sign-In is not enabled in Firebase Console. Go to Firebase Console > Authentication > Sign-in method, click Google, toggle Enable, and Save.'
        );
        return;
      }

      // Detect HTTP referrer restriction from Google Cloud Console API Key
      if (
        code.includes('requests-from-referer') ||
        msg.includes('requests-from-referer') ||
        msg.includes('are-blocked') ||
        code.includes('admin-restricted-operation') ||
        msg.includes('API_KEY_HTTP_REFERRER_BLOCKED')
      ) {
        setRefererBlockInfo({
          blockedOrigin: window.location.origin,
          allowedPattern: `${window.location.origin}/*`,
          gcpConsoleUrl: 'https://console.cloud.google.com/apis/credentials?project=t3project-507007',
          rawMessage: msg || code,
          rawCode: code,
          keySuffix: 'AIzaSy...IRUk-Xk',
        });
        setError(
          `Domain referrer is restricted on Google Cloud API key AIzaSy...IRUk-Xk.`
        );
        return;
      }

      if (code === 'auth/unauthorized-domain') {
        setError(
          'Domain not authorized in Firebase Authentication. You can continue in Local Private Mode.'
        );
        return;
      }

      setError(err?.message || 'Failed to sign in with Google. You can continue in Local Private Mode.');
    }
  };

  const signInWithEmailHandler = async (email: string, pass: string) => {
    clearError();
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';

      if (
        code.includes('requests-from-referer') ||
        msg.includes('requests-from-referer') ||
        msg.includes('are-blocked')
      ) {
        setRefererBlockInfo({
          blockedOrigin: window.location.origin,
          allowedPattern: `${window.location.origin}/*`,
          gcpConsoleUrl: 'https://console.cloud.google.com/apis/credentials?project=t3project-507007',
        });
        setError(
          `Domain referrer is restricted on the Google Cloud API key. Please continue in Local Private Mode.`
        );
        return;
      }

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
        console.warn('Email Sign-In Notice:', err);
        setError(err.message || 'Failed to sign in.');
      }
      throw err;
    }
  };

  const signUpWithEmailHandler = async (email: string, pass: string, name: string) => {
    clearError();
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user && name.trim()) {
        await updateProfile(res.user, { displayName: name.trim() });
      }
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';

      if (
        code.includes('requests-from-referer') ||
        msg.includes('requests-from-referer') ||
        msg.includes('are-blocked')
      ) {
        setRefererBlockInfo({
          blockedOrigin: window.location.origin,
          allowedPattern: `${window.location.origin}/*`,
          gcpConsoleUrl: 'https://console.cloud.google.com/apis/credentials?project=t3project-507007',
        });
        setError(
          `Domain referrer is restricted on the Google Cloud API key. Please continue in Local Private Mode.`
        );
        return;
      }

      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        console.warn('Sign Up Notice:', err);
        setError(err.message || 'Failed to create account.');
      }
      throw err;
    }
  };

  const signInAsGuestHandler = async () => {
    clearError();
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';

      // If anonymous auth is restricted by API key referrers or not enabled, switch to local session
      if (
        code.includes('requests-from-referer') ||
        msg.includes('requests-from-referer') ||
        msg.includes('are-blocked') ||
        code === 'auth/operation-not-allowed'
      ) {
        console.info('Switching to local sanctuary session...');
        startLocalSession();
        return;
      }

      if (code === 'auth/network-request-failed') {
        // Switch to local mode seamlessly
        startLocalSession();
        return;
      }

      console.warn('Guest sign-in fallback to local mode:', err?.message || err);
      startLocalSession();
    }
  };

  const logoutHandler = async () => {
    clearError();
    localStorage.removeItem('journal_local_session');
    setIsLocalMode(false);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (err: any) {
      console.warn('Logout notice:', err?.message || err);
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        refererBlockInfo,
        isLocalMode,
        signInWithGoogle: signInWithGoogleHandler,
        signInWithEmail: signInWithEmailHandler,
        signUpWithEmail: signUpWithEmailHandler,
        signInAsGuest: signInAsGuestHandler,
        startLocalSession,
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
