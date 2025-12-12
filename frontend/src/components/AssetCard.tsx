'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Asset } from '@/types';
import { formatDuration } from '@/lib/utils';

interface AssetCardProps {
  asset: Asset;
  index: number;
}

export function AssetCard({ asset, index }: AssetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/asset/${asset.id}`}>
        <div className="group border border-vault-border hover:border-vault-muted transition-all duration-300 p-6 bg-vault-dark/50">
          {/* Status indicator */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] vault-subtitle text-vault-muted">
              {asset.clearance_status === 'CLEARED' ? 'Verified' : asset.clearance_status}
            </span>
            <div className={`w-2 h-2 rounded-full ${
              asset.status === 'SETTLED' ? 'bg-vault-accent' : 'bg-vault-muted/30'
            }`} />
          </div>

          {/* Title */}
          <h3 className="text-lg text-vault-white mb-1 group-hover:text-vault-accent transition-colors">
            {asset.title}
          </h3>

          {/* Artist */}
          <p className="text-sm text-vault-muted mb-6">
            {asset.artist_display}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between text-xs text-vault-muted">
            <span>{asset.year}</span>
            <span className="font-mono">{formatDuration(asset.duration_seconds)}</span>
            <span>1/{asset.edition_total}</span>
          </div>

          {/* Fingerprint preview */}
          {asset.fingerprint_hash && (
            <div className="mt-4 pt-4 border-t border-vault-border">
              <p className="text-[10px] font-mono text-vault-muted/50 truncate">
                {asset.fingerprint_hash}
              </p>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
