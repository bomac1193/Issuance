// Shared TypeScript types for ISSUANCE platform
// These types are used by both frontend and can be imported by any TypeScript consumers

export type SettlementRule = 'IMMEDIATE' | 'ON_FIRST_PLAY' | 'ON_TRANSFER' | 'CUSTOM';
export type AssetStatus = 'ISSUED' | 'SETTLED';
export type ClearanceStatus = 'UNCHECKED' | 'CLEARED' | 'FLAGGED';
export type SettlementKind = 'PLAY' | 'TRANSFER';

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
  created_at: string;
  updated_at: string;
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
  kind: SettlementKind;
  occurred_at: string;
}

export interface AssetCreate {
  title: string;
  artist_display: string;
  year: number;
  edition_total: number;
  provenance_text?: string;
  settlement_rule?: SettlementRule;
}

export interface SINCResult {
  fingerprint_hash: string;
  duration_seconds: number;
  risk_score: number;
  clearance_status: ClearanceStatus;
}

export interface InvitationValidate {
  token: string;
}

export interface InvitationResponse {
  valid: boolean;
  message: string;
}

// Blockchain types
export interface BlockchainAsset {
  fingerprintHash: string;
  owner: string;
  consentFlags: number;
  timestamp: number;
}
