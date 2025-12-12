'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface VaultHeaderProps {
  showBack?: boolean;
}

export function VaultHeader({ showBack }: VaultHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('issuance_token');
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-vault-black/80 backdrop-blur-sm border-b border-vault-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="text-vault-muted hover:text-vault-white transition-colors text-xs vault-subtitle"
            >
              Back
            </button>
          )}
          <Link href="/registry" className="vault-title text-sm text-vault-white hover:text-vault-accent transition-colors">
            ISSUANCE
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="text-vault-muted hover:text-vault-white transition-colors text-xs vault-subtitle"
        >
          Exit
        </button>
      </div>
    </header>
  );
}
