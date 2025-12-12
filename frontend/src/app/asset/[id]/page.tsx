'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { VaultHeader } from '@/components/VaultHeader';
import { FractionalOwnership } from '@/components/FractionalOwnership';
import { getAsset, getCustodyChain, createSettlement, getAudioUrl } from '@/lib/api';
import { formatDuration, formatDate, truncateHash } from '@/lib/utils';
import { Asset, CustodyEvent } from '@/types';
import { Play, Pause, Volume2, ExternalLink, Settings } from 'lucide-react';

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = Number(params.id);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [custody, setCustody] = useState<CustodyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettlement, setShowSettlement] = useState(false);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('issuance_token');
    if (!token) {
      router.push('/');
      return;
    }

    loadAsset();
  }, [router, assetId]);

  const loadAsset = async () => {
    try {
      const [assetData, custodyData] = await Promise.all([
        getAsset(assetId),
        getCustodyChain(assetId),
      ]);
      setAsset(assetData);
      setCustody(custodyData);
    } catch (err) {
      console.error(err);
      router.push('/registry');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    setCurrentTime(0);

    // Create settlement event on playback completion
    if (asset && asset.status !== 'SETTLED') {
      try {
        await createSettlement(asset.id, 'PLAY');
        setShowSettlement(true);
        // Refresh asset data
        const updated = await getAsset(assetId);
        setAsset(updated);
      } catch (err) {
        console.error('Settlement failed:', err);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  if (loading) {
    return (
      <>
        <VaultHeader showBack />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border border-vault-border border-t-vault-accent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!asset) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <VaultHeader showBack />

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={getAudioUrl(asset.id)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <main className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Settlement Modal */}
          <AnimatePresence>
            {showSettlement && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-vault-black/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-center p-12 border border-vault-accent"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <div className="w-16 h-16 mx-auto mb-6 border border-vault-accent rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-vault-accent rounded-full" />
                  </div>
                  <h2 className="vault-title text-xl text-vault-white mb-2">Settled</h2>
                  <p className="text-sm text-vault-muted mb-6">
                    Playback complete. Asset settled.
                  </p>
                  <button
                    onClick={() => setShowSettlement(false)}
                    className="text-xs vault-subtitle text-vault-muted hover:text-vault-white transition-colors"
                  >
                    Continue
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Asset Header */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Status badges */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`text-[10px] vault-subtitle px-2 py-1 border ${
                asset.status === 'SETTLED'
                  ? 'border-vault-accent text-vault-accent'
                  : 'border-vault-border text-vault-muted'
              }`}>
                {asset.status}
              </span>
              <span className={`text-[10px] vault-subtitle px-2 py-1 border ${
                asset.clearance_status === 'CLEARED'
                  ? 'border-green-800 text-green-500'
                  : asset.clearance_status === 'FLAGGED'
                  ? 'border-red-800 text-red-500'
                  : 'border-vault-border text-vault-muted'
              }`}>
                {asset.clearance_status}
              </span>
              <span className="text-[10px] vault-subtitle px-2 py-1 border border-vault-border text-vault-muted">
                {asset.verification}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl text-vault-white mb-2">{asset.title}</h1>
            <p className="text-xl text-vault-muted">{asset.artist_display}</p>
          </motion.div>

          {/* Player */}
          <motion.div
            className="mb-12 p-6 border border-vault-border bg-vault-dark/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-6">
              {/* Play button */}
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 border border-vault-border hover:border-vault-muted rounded-full flex items-center justify-center transition-colors group"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-vault-muted group-hover:text-vault-white transition-colors" />
                ) : (
                  <Play className="w-5 h-5 text-vault-muted group-hover:text-vault-white transition-colors ml-0.5" />
                )}
              </button>

              {/* Progress bar */}
              <div className="flex-1">
                <div
                  className="h-1 bg-vault-border cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-vault-accent transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs font-mono text-vault-muted">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration || asset.duration_seconds)}</span>
                </div>
              </div>

              {/* Volume indicator */}
              <Volume2 className="w-4 h-4 text-vault-muted" />
            </div>
          </motion.div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Metadata */}
            <motion.div
              className="p-6 border border-vault-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="vault-subtitle text-xs text-vault-muted mb-4">Metadata</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-vault-muted">Year</dt>
                  <dd className="text-sm text-vault-white">{asset.year}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-vault-muted">Edition</dt>
                  <dd className="text-sm text-vault-white">1 of {asset.edition_total}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-vault-muted">Duration</dt>
                  <dd className="text-sm text-vault-white font-mono">
                    {formatDuration(asset.duration_seconds)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-vault-muted">Settlement</dt>
                  <dd className="text-sm text-vault-white">{asset.settlement_rule}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-vault-muted">Issued</dt>
                  <dd className="text-sm text-vault-white">{formatDate(asset.created_at)}</dd>
                </div>
              </dl>
            </motion.div>

            {/* Provenance */}
            <motion.div
              className="p-6 border border-vault-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="vault-subtitle text-xs text-vault-muted mb-4">Provenance</h3>
              {asset.provenance_text ? (
                <p className="text-sm text-vault-text leading-relaxed">
                  {asset.provenance_text}
                </p>
              ) : (
                <p className="text-sm text-vault-muted/50 italic">No provenance recorded</p>
              )}

              {/* Custody chain */}
              {custody.length > 0 && (
                <div className="mt-6 pt-4 border-t border-vault-border">
                  <h4 className="text-xs text-vault-muted mb-3">Custody Chain</h4>
                  <div className="space-y-2">
                    {custody.map((event, i) => (
                      <div key={event.id} className="flex items-center gap-2 text-xs">
                        <span className="text-vault-muted">{event.from_holder_label}</span>
                        <span className="text-vault-border">→</span>
                        <span className="text-vault-white">{event.to_holder_label}</span>
                        <span className="text-vault-muted/50 ml-auto">
                          {formatDate(event.occurred_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Fingerprint & Chain */}
          <motion.div
            className="p-6 border border-vault-border mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="vault-subtitle text-xs text-vault-muted mb-4">Verification</h3>

            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-vault-muted mb-1">Fingerprint Hash</dt>
                <dd className="text-sm font-mono text-vault-white break-all">
                  {asset.fingerprint_hash || '---'}
                </dd>
              </div>

              {asset.risk_score !== null && (
                <div className="flex items-center gap-4">
                  <div>
                    <dt className="text-xs text-vault-muted mb-1">Risk Score</dt>
                    <dd className="text-sm text-vault-white">
                      {(asset.risk_score * 100).toFixed(1)}%
                    </dd>
                  </div>
                  <div className="flex-1 h-1 bg-vault-border">
                    <div
                      className={`h-full ${
                        asset.risk_score < 0.3 ? 'bg-green-600' :
                        asset.risk_score < 0.6 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${asset.risk_score * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {asset.chain_tx_hash && (
                <div>
                  <dt className="text-xs text-vault-muted mb-1">Chain Transaction</dt>
                  <dd className="flex items-center gap-2">
                    <span className="text-sm font-mono text-vault-white">
                      {truncateHash(asset.chain_tx_hash, 12)}
                    </span>
                    <a
                      href={`https://polygonscan.com/tx/${asset.chain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-vault-muted hover:text-vault-accent transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </motion.div>

          {/* Fractional Ownership */}
          {asset.clearance_status === 'CLEARED' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-6"
            >
              <FractionalOwnership
                assetId={asset.id}
                isFragmentalized={asset.is_fractionalized}
                fractionCount={asset.fraction_count}
                onFractionalize={loadAsset}
              />
            </motion.div>
          )}

          {/* Settlement Link */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={() => router.push(`/settlement/${asset.id}`)}
              className="inline-flex items-center gap-2 text-sm text-vault-muted hover:text-vault-accent transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settlement Details
            </button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
