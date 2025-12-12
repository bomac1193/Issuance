import { Asset, CustodyEvent, SettlementEvent } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('issuance_token');
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
}

export async function validateInvitation(token: string): Promise<{ valid: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/auth/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  return response.json();
}

export async function getAssets(): Promise<Asset[]> {
  return fetchWithAuth('/api/assets');
}

export async function getAsset(id: number): Promise<Asset> {
  return fetchWithAuth(`/api/assets/${id}`);
}

export async function issueAsset(formData: FormData): Promise<Asset> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/assets/issue`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Issue failed' }));
    throw new Error(error.detail || 'Issue failed');
  }

  return response.json();
}

export async function getCustodyChain(assetId: number): Promise<CustodyEvent[]> {
  return fetchWithAuth(`/api/assets/${assetId}/custody`);
}

export async function createSettlement(assetId: number, kind: 'PLAY' | 'TRANSFER'): Promise<SettlementEvent> {
  return fetchWithAuth(`/api/assets/${assetId}/settlement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind }),
  });
}

export async function getSettlements(assetId: number): Promise<SettlementEvent[]> {
  return fetchWithAuth(`/api/assets/${assetId}/settlements`);
}

export function getAudioUrl(assetId: number): string {
  const token = getToken();
  return `${API_BASE}/api/assets/${assetId}/audio?token=${token}`;
}
