export type SettlementRule = 'IMMEDIATE' | 'ON_FIRST_PLAY' | 'ON_TRANSFER' | 'CUSTOM';
export type AssetStatus = 'ISSUED' | 'SETTLED';
export type ClearanceStatus = 'UNCHECKED' | 'CLEARED' | 'FLAGGED';

export interface Asset {
  id: number;
  title: string;
  artist_display: string;
  year: number;
  edition_total: number;
  duration_seconds: number | null;
  provenance_text: string | null;
  settlement_rule: SettlementRule;
  status: AssetStatus;
  clearance_status: ClearanceStatus;
  risk_score: number | null;
  fingerprint_hash: string | null;
  verification: string;
  chain_tx_hash: string | null;
  is_fractionalized: boolean;
  fraction_count: number | null;
  fractions_tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface FractionHolding {
  id: number;
  asset_id: number;
  holder_address: string;
  holder_label: string | null;
  fraction_amount: number;
  percentage: number;
  acquired_at: string;
}

export interface KYCRecord {
  wallet_address: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verification_level: number;
  verified_at: string | null;
}

export interface CustodyEvent {
  id: number;
  asset_id: number;
  from_holder_label: string;
  to_holder_label: string;
  occurred_at: string;
}

export interface SettlementEvent {
  id: number;
  asset_id: number;
  kind: 'PLAY' | 'TRANSFER';
  occurred_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
