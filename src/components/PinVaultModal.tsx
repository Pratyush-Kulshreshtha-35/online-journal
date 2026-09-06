import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, X, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface PinVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
  isUnlocked?: boolean;
  onLock?: () => void;
  mode?: 'unlock' | 'setup';
}

const PIN_STORAGE_KEY = 'journal_vault_pin_hash';

export function getStoredPin(): string | null {
  return localStorage.getItem(PIN_STORAGE_KEY);
}

export function isVaultConfigured(): boolean {
  return Boolean(getStoredPin());
}

export function verifyPin(pin: string): boolean {
  const stored = getStoredPin();
  if (!stored) return false;
  return btoa(pin) === stored;
}

export function savePin(pin: string) {
  localStorage.setItem(PIN_STORAGE_KEY, btoa(pin));
}

export const PinVaultModal: React.FC<PinVaultModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  isUnlocked = false,
  onLock,
  mode,
}) => {
  const [currentMode, setCurrentMode] = useState<'unlock' | 'setup'>('unlock');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setError(null);
      setSuccess(false);
      setCurrentMode(mode || (isVaultConfigured() ? 'unlock' : 'setup'));
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleDigitPress = (digit: string) => {
    setError(null);
    if (currentMode === 'unlock') {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          if (verifyPin(next)) {
            setSuccess(true);
            setTimeout(() => {
              onUnlockSuccess();
              onClose();
            }, 300);
          } else {
            setError('Incorrect 4-digit PIN.');
            setTimeout(() => setPin(''), 500);
          }
        }
      }
    } else {
      // setup mode
      if (pin.length < 4) {
        setPin(pin + digit);
      } else if (confirmPin.length < 4) {
        const nextConfirm = confirmPin + digit;
        setConfirmPin(nextConfirm);
        if (nextConfirm.length === 4) {
          if (pin === nextConfirm) {
            savePin(pin);
            setSuccess(true);
            setTimeout(() => {
              onUnlockSuccess();
              onClose();
            }, 400);
          } else {
            setError('PINs do not match. Try again.');
            setPin('');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    if (currentMode === 'unlock') {
      setPin(pin.slice(0, -1));
    } else {
      if (confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else {
        setPin(pin.slice(0, -1));
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setConfirmPin('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#111111] border border-[#262626] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-5 text-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
              {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-serif-journal font-bold text-white text-base">
                {currentMode === 'setup' ? 'Setup Vault PIN' : isUnlocked ? 'Vault Status' : 'Unlock Private Vault'}
              </h3>
              <p className="text-[10px] text-stone-500 font-mono-journal">
                {currentMode === 'setup' ? 'Choose 4-digit code' : isUnlocked ? 'Unlocked for this session' : 'Enter 4-digit PIN'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-500 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isUnlocked && currentMode !== 'setup' ? (
          <div className="py-4 space-y-4 text-center">
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-emerald-300 text-xs">
              <p className="font-semibold text-emerald-400 mb-1">Vault Unlocked</p>
              <p className="text-[11px] text-stone-400">All locked entries and private media are currently visible.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onLock) onLock();
                  onClose();
                }}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault Now</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('setup');
                  setPin('');
                  setConfirmPin('');
                }}
                className="w-full py-2 text-stone-400 hover:text-amber-400 text-xs transition"
              >
                Change PIN Code
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* PIN Dots display */}
            <div className="py-2 text-center space-y-3">
              <div className="text-xs text-stone-400 font-serif-journal">
                {currentMode === 'setup'
                  ? pin.length < 4
                    ? 'Enter new 4-digit PIN'
                    : 'Re-enter to confirm PIN'
                  : 'Enter your PIN to reveal locked entries'}
              </div>

              <div className="flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => {
                  const activeLength = currentMode === 'setup' && pin.length >= 4 ? confirmPin.length : pin.length;
                  const filled = idx < activeLength;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-200 border ${
                        filled
                          ? 'bg-amber-500 border-amber-400 scale-110 shadow-[0_0_10px_rgba(217,119,6,0.5)]'
                          : 'bg-[#181818] border-[#333333]'
                      }`}
                    />
                  );
                })}
              </div>

              {error && (
                <div className="flex items-center justify-center gap-1 text-xs text-rose-400 font-mono-journal">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 font-mono-journal">
                  <Check className="w-3.5 h-3.5" />
                  <span>{currentMode === 'setup' ? 'PIN Saved!' : 'Vault Unlocked!'}</span>
                </div>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-12 rounded-2xl bg-[#181818] hover:bg-[#242424] active:bg-amber-600/30 border border-[#2A2A2A] hover:border-amber-600/40 text-stone-200 hover:text-white font-mono-journal font-bold text-lg transition flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-2xl bg-[#141414] hover:bg-[#1C1C1C] border border-[#222222] text-stone-500 text-xs font-mono-journal transition flex items-center justify-center"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-12 rounded-2xl bg-[#181818] hover:bg-[#242424] border border-[#2A2A2A] hover:border-amber-600/40 text-stone-200 hover:text-white font-mono-journal font-bold text-lg transition flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-2xl bg-[#141414] hover:bg-[#1C1C1C] border border-[#222222] text-stone-400 text-xs font-mono-journal transition flex items-center justify-center"
              >
                &larr; Del
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
