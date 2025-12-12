'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { VaultHeader } from '@/components/VaultHeader';
import { AssetCard } from '@/components/AssetCard';
import { getAssets } from '@/lib/api';
import { Asset } from '@/types';

export default function RegistryPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('issuance_token');
    if (!token) {
      router.push('/');
      return;
    }

    loadAssets();
  }, [router]);

  const loadAssets = async () => {
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (err) {
      setError('Failed to load registry');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <VaultHeader />

      <main className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="vault-subtitle text-xs text-vault-muted mb-2">Registry</h1>
            <div className="flex items-center justify-between">
              <p className="text-2xl text-vault-white">Issued Assets</p>
              <span className="text-xs text-vault-muted font-mono">
                {assets.length} registered
              </span>
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border border-vault-border border-t-vault-accent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-vault-muted">{error}</p>
            </motion.div>
          ) : assets.length === 0 ? (
            <motion.div
              className="text-center py-24 border border-vault-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-vault-muted mb-2">No assets issued</p>
              <p className="text-xs text-vault-muted/50">The vault is empty</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset, index) => (
                <AssetCard key={asset.id} asset={asset} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
