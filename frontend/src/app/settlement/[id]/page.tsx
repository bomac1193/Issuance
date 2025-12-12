'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { VaultHeader } from '@/components/VaultHeader';
import { getAsset, getSettlements, createSettlement } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Asset, SettlementEvent } from '@/types';
import { Check, Clock, ArrowRight, Play, RefreshCw } from 'lucide-react';

export default function SettlementPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = Number(params.id);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [settlements, setSettlements] = useState<SettlementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('issuance_token');
    if (!token) {
      router.push('/');
      return;
    }

    loadData();
  }, [router, assetId]);

  const loadData = async () => {
    try {
      const [assetData, settlementsData] = await Promise.all([
        getAsset(assetId),
        getSettlements(assetId),
      ]);
      setAsset(assetData);
      setSettlements(settlementsData);
    } catch (err) {
      console.error(err);
      router.push('/registry');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSettle = async (kind: 'PLAY' | 'TRANSFER') => {
    if (!asset) return;

    setSettling(true);
    try {
      await createSettlement(asset.id, kind);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSettling(false);
    }
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

  const isSettled = asset.status === 'SETTLED';

  const getSettlementRuleDescription = (rule: string) => {
    switch (rule) {
      case 'IMMEDIATE':
        return 'This asset settles immediately upon issuance.';
      case 'ON_FIRST_PLAY':
        return 'This asset settles when it is played for the first time.';
      case 'ON_TRANSFER':
        return 'This asset settles when ownership is transferred.';
      case 'CUSTOM':
        return 'This asset has custom settlement logic.';
      default:
        return '';
    }
  };

  return (
    <>
      <VaultHeader showBack />

      <main className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="vault-subtitle text-xs text-vault-muted mb-2">Settlement</h1>
            <p className="text-3xl text-vault-white mb-4">{asset.title}</p>
            <p className="text-vault-muted">{asset.artist_display}</p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            className={`border p-8 mb-8 text-center ${
              isSettled ? 'border-vault-accent' : 'border-vault-border'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isSettled
                ? 'bg-vault-accent text-vault-black'
                : 'border-2 border-vault-border text-vault-muted'
            }`}>
              {isSettled ? (
                <Check className="w-8 h-8" />
              ) : (
                <Clock className="w-8 h-8" />
              )}
            </div>

            <h2 className="vault-title text-xl text-vault-white mb-2">
              {isSettled ? 'Settled' : 'Pending Settlement'}
            </h2>

            <p className="text-sm text-vault-muted mb-6">
              {getSettlementRuleDescription(asset.settlement_rule)}
            </p>

            <div className="inline-block px-4 py-2 bg-vault-dark border border-vault-border">
              <span className="text-xs vault-subtitle text-vault-muted">Rule: </span>
              <span className="text-xs text-vault-white">{asset.settlement_rule.replace(/_/g, ' ')}</span>
            </div>
          </motion.div>

          {/* Settlement Actions */}
          {!isSettled && (
            <motion.div
              className="border border-vault-border p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="vault-subtitle text-xs text-vault-muted mb-4">Trigger Settlement</h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleManualSettle('PLAY')}
                  disabled={settling}
                  className="flex items-center justify-center gap-2 p-4 border border-vault-border hover:border-vault-accent hover:text-vault-accent transition-colors disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm">Record Play</span>
                </button>

                <button
                  onClick={() => handleManualSettle('TRANSFER')}
                  disabled={settling}
                  className="flex items-center justify-center gap-2 p-4 border border-vault-border hover:border-vault-accent hover:text-vault-accent transition-colors disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-sm">Record Transfer</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Settlement History */}
          <motion.div
            className="border border-vault-border p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="vault-subtitle text-xs text-vault-muted">Settlement Events</h3>
              <button
                onClick={loadData}
                className="p-1 text-vault-muted hover:text-vault-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {settlements.length === 0 ? (
              <p className="text-sm text-vault-muted/50 text-center py-8">
                No settlement events recorded
              </p>
            ) : (
              <div className="space-y-3">
                {settlements.map((event, i) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between py-3 border-b border-vault-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        event.kind === 'PLAY'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-purple-900/30 text-purple-400'
                      }`}>
                        {event.kind === 'PLAY' ? (
                          <Play className="w-3 h-3" />
                        ) : (
                          <ArrowRight className="w-3 h-3" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-vault-white">{event.kind}</p>
                        <p className="text-xs text-vault-muted">Event #{event.id}</p>
                      </div>
                    </div>
                    <span className="text-xs text-vault-muted">
                      {formatDate(event.occurred_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Back to Asset */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => router.push(`/asset/${asset.id}`)}
              className="text-sm text-vault-muted hover:text-vault-white transition-colors"
            >
              ← Back to Asset
            </button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
