'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { VaultHeader } from '@/components/VaultHeader';
import { issueAsset } from '@/lib/api';
import { Upload, X, Check, ChevronRight, Shield, Fingerprint, Link2 } from 'lucide-react';

type CeremonyStep = 'upload' | 'metadata' | 'verify' | 'issue' | 'complete';

export default function CeremonyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<CeremonyStep>('upload');
  const [formData, setFormData] = useState({
    title: '',
    artist_display: '',
    year: new Date().getFullYear(),
    edition_total: 1,
    provenance_text: '',
    settlement_rule: 'ON_FIRST_PLAY',
    enable_fractionalization: false,
    fraction_count: 100,
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issuedAsset, setIssuedAsset] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState({
    fingerprint: false,
    clearance: false,
    blockchain: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('issuance_token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              (name === 'year' || name === 'edition_total' || name === 'fraction_count')
                ? Number(value) : value,
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
      setAudioPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleVerification = async () => {
    setStep('verify');

    // Simulate verification steps
    await new Promise(r => setTimeout(r, 1500));
    setVerificationStatus(prev => ({ ...prev, fingerprint: true }));

    await new Promise(r => setTimeout(r, 1200));
    setVerificationStatus(prev => ({ ...prev, clearance: true }));

    await new Promise(r => setTimeout(r, 1000));
    setVerificationStatus(prev => ({ ...prev, blockchain: true }));

    await new Promise(r => setTimeout(r, 500));
    setStep('issue');
  };

  const handleIssue = async () => {
    if (!audioFile) return;

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
      setIssuedAsset(result);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Issue failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'upload', label: 'Upload' },
    { key: 'metadata', label: 'Details' },
    { key: 'verify', label: 'Verify' },
    { key: 'issue', label: 'Issue' },
    { key: 'complete', label: 'Complete' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <>
      <VaultHeader showBack />

      <main className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="vault-subtitle text-xs text-vault-muted mb-2">Ceremony</h1>
            <p className="text-3xl text-vault-white">Issue Sound</p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            className="flex items-center justify-center gap-2 mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300 ${
                  i < currentStepIndex
                    ? 'bg-vault-accent text-vault-black'
                    : i === currentStepIndex
                      ? 'border-2 border-vault-accent text-vault-accent'
                      : 'border border-vault-border text-vault-muted'
                }`}>
                  {i < currentStepIndex ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-px mx-2 transition-colors duration-300 ${
                    i < currentStepIndex ? 'bg-vault-accent' : 'bg-vault-border'
                  }`} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="border border-vault-border p-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,.mp3,.flac,.aiff,.m4a"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {audioFile ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg text-vault-white">{audioFile.name}</p>
                          <p className="text-sm text-vault-muted">
                            {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAudioFile(null);
                            setAudioPreview(null);
                          }}
                          className="p-2 hover:bg-vault-border rounded transition-colors"
                        >
                          <X className="w-5 h-5 text-vault-muted" />
                        </button>
                      </div>

                      {audioPreview && (
                        <audio
                          src={audioPreview}
                          controls
                          className="w-full opacity-70"
                        />
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-16 flex flex-col items-center gap-4 text-vault-muted hover:text-vault-white transition-colors group"
                    >
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-vault-border group-hover:border-vault-muted flex items-center justify-center transition-colors">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg mb-1">Select Audio File</p>
                        <p className="text-xs text-vault-muted/50">WAV, MP3, FLAC, AIFF, M4A</p>
                      </div>
                    </button>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep('metadata')}
                    disabled={!audioFile}
                    className="flex items-center gap-2 px-6 py-3 border border-vault-accent text-vault-accent hover:bg-vault-accent hover:text-vault-black disabled:opacity-30 disabled:cursor-not-allowed transition-all vault-subtitle text-sm"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Metadata Step */}
            {step === 'metadata' && (
              <motion.div
                key="metadata"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-vault-muted mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-transparent border border-vault-border px-4 py-3 text-vault-white text-lg placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-muted transition-colors"
                      placeholder="Work title"
                    />
                  </div>

                  <div className="md:col-span-2">
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

                  <div>
                    <label className="block text-xs text-vault-muted mb-2">Year</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      min="1900"
                      max="2100"
                      className="w-full bg-transparent border border-vault-border px-4 py-3 text-vault-white focus:outline-none focus:border-vault-muted transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-vault-muted mb-2">Edition Size (max 21)</label>
                    <input
                      type="number"
                      name="edition_total"
                      value={formData.edition_total}
                      onChange={handleInputChange}
                      min="1"
                      max="21"
                      className="w-full bg-transparent border border-vault-border px-4 py-3 text-vault-white focus:outline-none focus:border-vault-muted transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-vault-muted mb-2">Settlement Rule</label>
                    <select
                      name="settlement_rule"
                      value={formData.settlement_rule}
                      onChange={handleInputChange}
                      className="w-full bg-vault-black border border-vault-border px-4 py-3 text-vault-white focus:outline-none focus:border-vault-muted transition-colors"
                    >
                      <option value="IMMEDIATE">Immediate - Settles upon issuance</option>
                      <option value="ON_FIRST_PLAY">On First Play - Settles when first played</option>
                      <option value="ON_TRANSFER">On Transfer - Settles when ownership transfers</option>
                      <option value="CUSTOM">Custom - Define custom settlement logic</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
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

                  {/* Fractionalization Option */}
                  <div className="md:col-span-2 border border-vault-border p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="enable_fractionalization"
                        checked={formData.enable_fractionalization}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-vault-accent"
                      />
                      <div>
                        <p className="text-sm text-vault-white">Enable Fractional Ownership</p>
                        <p className="text-xs text-vault-muted">Allow multiple investors to own shares of this asset</p>
                      </div>
                    </label>

                    {formData.enable_fractionalization && (
                      <div className="mt-4 pt-4 border-t border-vault-border">
                        <label className="block text-xs text-vault-muted mb-2">Number of Fractions</label>
                        <input
                          type="number"
                          name="fraction_count"
                          value={formData.fraction_count}
                          onChange={handleInputChange}
                          min="2"
                          max="10000"
                          className="w-32 bg-transparent border border-vault-border px-4 py-2 text-vault-white focus:outline-none focus:border-vault-muted transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep('upload')}
                    className="text-sm text-vault-muted hover:text-vault-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerification}
                    disabled={!formData.title || !formData.artist_display}
                    className="flex items-center gap-2 px-6 py-3 border border-vault-accent text-vault-accent hover:bg-vault-accent hover:text-vault-black disabled:opacity-30 disabled:cursor-not-allowed transition-all vault-subtitle text-sm"
                  >
                    Verify <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Verify Step */}
            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="border border-vault-border p-8 space-y-6">
                  <h3 className="text-center text-vault-muted vault-subtitle text-xs mb-8">
                    Verifying Asset
                  </h3>

                  {/* Fingerprint */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                      verificationStatus.fingerprint
                        ? 'bg-vault-accent text-vault-black'
                        : 'border border-vault-border text-vault-muted'
                    }`}>
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-vault-white">Audio Fingerprint</p>
                      <p className="text-xs text-vault-muted">
                        {verificationStatus.fingerprint ? 'Generated unique SINC fingerprint' : 'Generating...'}
                      </p>
                    </div>
                    {verificationStatus.fingerprint && (
                      <Check className="w-5 h-5 text-vault-accent" />
                    )}
                  </div>

                  {/* Clearance */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                      verificationStatus.clearance
                        ? 'bg-vault-accent text-vault-black'
                        : 'border border-vault-border text-vault-muted'
                    }`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-vault-white">Rights Clearance</p>
                      <p className="text-xs text-vault-muted">
                        {verificationStatus.clearance ? 'No conflicts detected' : 'Checking...'}
                      </p>
                    </div>
                    {verificationStatus.clearance && (
                      <Check className="w-5 h-5 text-vault-accent" />
                    )}
                  </div>

                  {/* Blockchain */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                      verificationStatus.blockchain
                        ? 'bg-vault-accent text-vault-black'
                        : 'border border-vault-border text-vault-muted'
                    }`}>
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-vault-white">Blockchain Ready</p>
                      <p className="text-xs text-vault-muted">
                        {verificationStatus.blockchain ? 'Polygon network connected' : 'Preparing...'}
                      </p>
                    </div>
                    {verificationStatus.blockchain && (
                      <Check className="w-5 h-5 text-vault-accent" />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Issue Step */}
            {step === 'issue' && (
              <motion.div
                key="issue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="border border-vault-accent p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 border-2 border-vault-accent rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-vault-accent" />
                  </div>

                  <h3 className="text-2xl text-vault-white mb-2">{formData.title}</h3>
                  <p className="text-vault-muted mb-6">{formData.artist_display}</p>

                  <div className="grid grid-cols-3 gap-4 text-center mb-8">
                    <div>
                      <p className="text-xs text-vault-muted">Year</p>
                      <p className="text-vault-white">{formData.year}</p>
                    </div>
                    <div>
                      <p className="text-xs text-vault-muted">Edition</p>
                      <p className="text-vault-white">1/{formData.edition_total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-vault-muted">Settlement</p>
                      <p className="text-vault-white text-xs">{formData.settlement_rule.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 mb-4">{error}</p>
                  )}

                  <button
                    onClick={handleIssue}
                    disabled={loading}
                    className="w-full py-4 bg-vault-accent text-vault-black hover:bg-vault-gold disabled:opacity-50 transition-all vault-subtitle text-sm"
                  >
                    {loading ? 'Issuing...' : 'Issue to Blockchain'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Complete Step */}
            {step === 'complete' && issuedAsset && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="w-24 h-24 mx-auto border-2 border-vault-accent rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-vault-accent" />
                </div>

                <div>
                  <h2 className="vault-title text-2xl text-vault-white mb-2">Issued</h2>
                  <p className="text-vault-muted">
                    Sound asset has been issued to the blockchain
                  </p>
                </div>

                <div className="border border-vault-border p-6 text-left space-y-4">
                  <div>
                    <p className="text-xs text-vault-muted">Asset ID</p>
                    <p className="text-vault-white font-mono">#{issuedAsset.id}</p>
                  </div>
                  {issuedAsset.fingerprint_hash && (
                    <div>
                      <p className="text-xs text-vault-muted">Fingerprint</p>
                      <p className="text-vault-white font-mono text-xs break-all">
                        {issuedAsset.fingerprint_hash}
                      </p>
                    </div>
                  )}
                  {issuedAsset.chain_tx_hash && (
                    <div>
                      <p className="text-xs text-vault-muted">Transaction</p>
                      <p className="text-vault-white font-mono text-xs break-all">
                        {issuedAsset.chain_tx_hash}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => router.push(`/asset/${issuedAsset.id}`)}
                    className="px-6 py-3 border border-vault-accent text-vault-accent hover:bg-vault-accent hover:text-vault-black transition-all vault-subtitle text-sm"
                  >
                    View Asset
                  </button>
                  <button
                    onClick={() => router.push('/registry')}
                    className="px-6 py-3 text-vault-muted hover:text-vault-white transition-colors vault-subtitle text-sm"
                  >
                    Registry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
