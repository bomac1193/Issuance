'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { VaultHeader } from '@/components/VaultHeader';
import { issueAsset } from '@/lib/api';
import { Upload, X, Check } from 'lucide-react';

export default function IssuePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    artist_display: '',
    year: new Date().getFullYear(),
    edition_total: 1,
    provenance_text: '',
    settlement_rule: 'IMMEDIATE',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [issuedId, setIssuedId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('issuance_token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'edition_total' ? Number(value) : value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/flac', 'audio/aiff', 'audio/x-m4a', 'audio/mp4'];
      if (!validTypes.some(t => file.type.includes(t.split('/')[1]))) {
        setError('Invalid audio format. Use WAV, MP3, FLAC, AIFF, or M4A.');
        return;
      }
      setAudioFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setError('Audio file required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('artist_display', formData.artist_display);
      data.append('year', String(formData.year));
      data.append('edition_total', String(formData.edition_total));
      data.append('provenance_text', formData.provenance_text);
      data.append('settlement_rule', formData.settlement_rule);
      data.append('audio_file', audioFile);

      const result = await issueAsset(data);
      setIssuedId(result.id);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Issue failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <VaultHeader showBack />

      <main className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Success Modal */}
          <AnimatePresence>
            {success && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-vault-black/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-center p-12 border border-vault-accent max-w-md"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <div className="w-16 h-16 mx-auto mb-6 border border-vault-accent rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-vault-accent" />
                  </div>
                  <h2 className="vault-title text-xl text-vault-white mb-2">Issued</h2>
                  <p className="text-sm text-vault-muted mb-6">
                    Sound asset has been issued to the registry.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => router.push(`/asset/${issuedId}`)}
                      className="text-xs vault-subtitle text-vault-accent hover:text-vault-white transition-colors px-4 py-2 border border-vault-accent"
                    >
                      View Asset
                    </button>
                    <button
                      onClick={() => router.push('/registry')}
                      className="text-xs vault-subtitle text-vault-muted hover:text-vault-white transition-colors"
                    >
                      Registry
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="vault-subtitle text-xs text-vault-muted mb-2">Issue</h1>
            <p className="text-2xl text-vault-white">Issue Sound Asset</p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Audio Upload */}
            <div className="p-6 border border-vault-border">
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav,.mp3,.flac,.aiff,.m4a"
                onChange={handleFileSelect}
                className="hidden"
              />

              {audioFile ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-vault-white">{audioFile.name}</p>
                    <p className="text-xs text-vault-muted">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioFile(null)}
                    className="p-2 hover:bg-vault-border rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-vault-muted" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 flex flex-col items-center gap-3 text-vault-muted hover:text-vault-white transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Select Audio File</span>
                  <span className="text-xs text-vault-muted/50">WAV, MP3, FLAC, AIFF, M4A</span>
                </button>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs text-vault-muted mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full bg-transparent border border-vault-border px-4 py-3 text-vault-white placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-muted transition-colors"
                placeholder="Work title"
              />
            </div>

            {/* Artist */}
            <div>
              <label className="block text-xs text-vault-muted mb-2">Artist</label>
              <input
                type="text"
                name="artist_display"
                value={formData.artist_display}
                onChange={handleInputChange}
                required
                className="w-full bg-transparent border border-vault-border px-4 py-3 text-vault-white placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-muted transition-colors"
                placeholder="Artist or creator"
              />
            </div>

            {/* Year & Edition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-vault-muted mb-2">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max="2100"
                  required
                  className="w-full bg-transparent border border-vault-border px-4 py-3 text-vault-white focus:outline-none focus:border-vault-muted transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-vault-muted mb-2">Edition (max 21)</label>
                <input
                  type="number"
                  name="edition_total"
                  value={formData.edition_total}
                  onChange={handleInputChange}
                  min="1"
                  max="21"
                  required
                  className="w-full bg-transparent border border-vault-border px-4 py-3 text-vault-white focus:outline-none focus:border-vault-muted transition-colors"
                />
              </div>
            </div>

            {/* Settlement Rule */}
            <div>
              <label className="block text-xs text-vault-muted mb-2">Settlement Rule</label>
              <select
                name="settlement_rule"
                value={formData.settlement_rule}
                onChange={handleInputChange}
                className="w-full bg-vault-black border border-vault-border px-4 py-3 text-vault-white focus:outline-none focus:border-vault-muted transition-colors"
              >
                <option value="IMMEDIATE">Immediate</option>
                <option value="ON_FIRST_PLAY">On First Play</option>
                <option value="ON_TRANSFER">On Transfer</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            {/* Provenance */}
            <div>
              <label className="block text-xs text-vault-muted mb-2">Provenance</label>
              <textarea
                name="provenance_text"
                value={formData.provenance_text}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-transparent border border-vault-border px-4 py-3 text-vault-white placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-muted transition-colors resize-none"
                placeholder="Origin and history of the work..."
              />
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-500"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !audioFile}
              className="w-full py-4 border border-vault-accent text-vault-accent hover:bg-vault-accent hover:text-vault-black disabled:opacity-30 disabled:cursor-not-allowed transition-all vault-subtitle text-sm"
            >
              {loading ? 'Issuing...' : 'Issue Sound'}
            </button>
          </motion.form>
        </div>
      </main>
    </>
  );
}
