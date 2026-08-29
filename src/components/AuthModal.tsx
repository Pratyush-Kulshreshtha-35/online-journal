import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { BookOpen, Sparkles, Mail, Lock, User, ArrowRight, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialMode?: 'signin' | 'signup';
  forced?: boolean; // if true, cannot close without authenticating
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  forced = false,
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, error, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      if (auth.currentUser && onClose) onClose();
    } catch {
      // Handled in auth context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      if (auth.currentUser && onClose) onClose();
    } catch {
      // Handled in auth context
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      if (auth.currentUser && onClose) onClose();
    } catch {
      // Handled in auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="auth-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#0F0F0F] border border-[#262626] rounded-2xl shadow-2xl p-6 sm:p-8 text-stone-200 overflow-hidden"
          id="auth-card"
        >
          {/* Subtle gold accent highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700" />

          {!forced && onClose && (
            <button
              id="auth-close-button"
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-[#222222] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white font-serif-journal">
                {mode === 'signin' ? 'Welcome Back' : 'Create Your Journal'}
              </h2>
              <p className="text-xs text-stone-400 font-mono-journal">
                {mode === 'signin'
                  ? 'Sign in to access your private encrypted entries'
                  : 'Start your personal sanctuary for thoughts and memories'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 mb-5 bg-[#141414] rounded-xl border border-[#242424]">
            <button
              id="tab-signin"
              type="button"
              onClick={() => {
                clearError();
                setMode('signin');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              type="button"
              onClick={() => {
                clearError();
                setMode('signup');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-[#222222] text-amber-400 border border-[#333333] shadow-xs'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2"
              id="auth-error-banner"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Google Sign-In Quick Action */}
          <button
            id="google-signin-button"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#161616] hover:bg-[#202020] text-stone-200 border border-[#2A2A2A] rounded-xl font-medium text-sm transition-all shadow-md disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-[#242424] w-full" />
            <span className="bg-[#0F0F0F] px-3 text-stone-500 text-xs uppercase tracking-wider font-mono-journal">
              or
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5" id="auth-form">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1" htmlFor="auth-name">
                  Your Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#282828] text-white placeholder:text-stone-600 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1" htmlFor="auth-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#282828] text-white placeholder:text-stone-600 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1" htmlFor="auth-password">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#282828] text-white placeholder:text-stone-600 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>
              {mode === 'signup' && (
                <p className="text-[11px] text-stone-500 mt-1 font-mono-journal">Must be at least 6 characters</p>
              )}
            </div>

            <button
              id="auth-submit-button"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-black font-semibold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(217,119,6,0.25)] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-stone-800 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Journal' : 'Create Journal Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Guest Tryout Option */}
          <div className="mt-5 pt-4 border-t border-[#242424] text-center">
            <button
              id="guest-signin-button"
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Or try instantly as a Guest (no email required)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
