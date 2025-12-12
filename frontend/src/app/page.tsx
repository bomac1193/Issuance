'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { validateInvitation } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [showInput, setShowInput] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnter = () => {
    setShowInput(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await validateInvitation(token.trim());
      if (result.valid) {
        localStorage.setItem('issuance_token', token.trim());
        router.push('/registry');
      } else {
        setError('Invalid invitation');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-vault-black">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-vault-accent/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 text-center"
      >
        {/* Logo */}
        <motion.h1
          className="vault-title text-4xl md:text-6xl text-vault-white mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          ISSUANCE
        </motion.h1>

        <motion.p
          className="vault-subtitle text-xs text-vault-muted mb-16"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Sound Registry
        </motion.p>

        <AnimatePresence mode="wait">
          {!showInput ? (
            <motion.button
              key="enter"
              onClick={handleEnter}
              className="vault-subtitle text-sm text-vault-muted hover:text-vault-white transition-colors duration-300 px-8 py-4 border border-vault-border hover:border-vault-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Enter
            </motion.button>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Invitation"
                  autoFocus
                  className="w-64 bg-transparent border border-vault-border px-4 py-3 text-center text-sm text-vault-white placeholder:text-vault-muted focus:outline-none focus:border-vault-muted transition-colors font-mono"
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -bottom-6 left-0 right-0 text-xs text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="vault-subtitle text-xs text-vault-muted hover:text-vault-white disabled:opacity-30 transition-colors duration-300"
              >
                {loading ? '...' : 'Submit'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="fixed bottom-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <p className="text-[10px] text-vault-muted/50 vault-subtitle">
          Sound is Issued
        </p>
      </motion.footer>
    </main>
  );
}
