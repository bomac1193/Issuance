'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Users, TrendingUp, Lock } from 'lucide-react';

interface FractionHolding {
  id: number;
  holder_address: string;
  holder_label: string | null;
  fraction_amount: number;
  percentage: number;
}

interface FractionalOwnershipProps {
  assetId: number;
  isFragmentalized: boolean;
  fractionCount: number | null;
  onFractionalize?: () => void;
}

export function FractionalOwnership({
  assetId,
  isFragmentalized,
  fractionCount,
  onFractionalize
}: FractionalOwnershipProps) {
  const [holdings, setHoldings] = useState<FractionHolding[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFractionalizeModal, setShowFractionalizeModal] = useState(false);
  const [fractionInput, setFractionInput] = useState(100);

  useEffect(() => {
    if (isFragmentalized) {
      loadHoldings();
    }
  }, [assetId, isFragmentalized]);

  const loadHoldings = async () => {
    try {
      const token = localStorage.getItem('issuance_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/assets/${assetId}/fractions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setHoldings(data);
      }
    } catch (err) {
      console.error('Failed to load holdings:', err);
    }
  };

  const handleFractionalize = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('issuance_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/assets/${assetId}/fractionalize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ fraction_count: fractionInput })
        }
      );

      if (response.ok) {
        setShowFractionalizeModal(false);
        onFractionalize?.();
        loadHoldings();
      }
    } catch (err) {
      console.error('Fractionalization failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isFragmentalized) {
    return (
      <div className="border border-vault-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-vault-muted" />
          <h3 className="vault-subtitle text-xs text-vault-muted">Fractional Ownership</h3>
        </div>

        <p className="text-sm text-vault-muted mb-6">
          Enable fractional ownership to allow multiple investors to own shares of this asset.
        </p>

        <button
          onClick={() => setShowFractionalizeModal(true)}
          className="w-full py-3 border border-vault-accent text-vault-accent hover:bg-vault-accent hover:text-vault-black transition-all text-sm"
        >
          Enable Fractionalization
        </button>

        {/* Fractionalize Modal */}
        <AnimatePresence>
          {showFractionalizeModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-vault-black/90 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md border border-vault-border bg-vault-dark p-8"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <h3 className="text-xl text-vault-white mb-2">Fractionalize Asset</h3>
                <p className="text-sm text-vault-muted mb-6">
                  Split this asset into tradeable fractions using ERC-1155.
                </p>

                <div className="mb-6">
                  <label className="block text-xs text-vault-muted mb-2">Number of Fractions</label>
                  <input
                    type="number"
                    value={fractionInput}
                    onChange={(e) => setFractionInput(Math.max(2, Math.min(10000, Number(e.target.value))))}
                    min="2"
                    max="10000"
                    className="w-full bg-transparent border border-vault-border px-4 py-3 text-vault-white focus:outline-none focus:border-vault-muted"
                  />
                  <p className="text-xs text-vault-muted mt-2">
                    Each fraction represents {(100 / fractionInput).toFixed(4)}% ownership
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowFractionalizeModal(false)}
                    className="flex-1 py-3 border border-vault-border text-vault-muted hover:text-vault-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFractionalize}
                    disabled={loading}
                    className="flex-1 py-3 bg-vault-accent text-vault-black hover:bg-vault-gold disabled:opacity-50 transition-all text-sm"
                  >
                    {loading ? 'Processing...' : 'Fractionalize'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="border border-vault-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <PieChart className="w-5 h-5 text-vault-accent" />
          <h3 className="vault-subtitle text-xs text-vault-muted">Fractional Ownership</h3>
        </div>
        <span className="text-xs text-vault-accent font-mono">
          {fractionCount} fractions
        </span>
      </div>

      {/* Holdings List */}
      <div className="space-y-3">
        {holdings.map((holding, i) => (
          <div
            key={holding.id}
            className="flex items-center justify-between py-3 border-b border-vault-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-vault-border flex items-center justify-center text-xs text-vault-muted">
                {i + 1}
              </div>
              <div>
                <p className="text-sm text-vault-white">
                  {holding.holder_label || truncateAddress(holding.holder_address)}
                </p>
                <p className="text-xs text-vault-muted font-mono">
                  {truncateAddress(holding.holder_address)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-vault-white">{holding.percentage.toFixed(2)}%</p>
              <p className="text-xs text-vault-muted">
                {holding.fraction_amount} fractions
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trading Info */}
      <div className="mt-6 pt-4 border-t border-vault-border">
        <div className="flex items-center gap-2 text-xs text-vault-muted">
          <TrendingUp className="w-4 h-4" />
          <span>Secondary trading available on Polygon</span>
        </div>
      </div>
    </div>
  );
}
