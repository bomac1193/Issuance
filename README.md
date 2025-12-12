# ISSUANCE

Luxury sound registry platform. Sound is issued as art assets with scarcity, provenance, and settlement.

## Architecture

```
issuance/
├── frontend/          # Next.js + TypeScript + Tailwind + Framer Motion
├── backend/           # FastAPI + SQLite
├── sinc/              # SINC fingerprinting engine (Python)
├── contracts/         # Solidity smart contract (Polygon)
└── shared/            # Shared TypeScript types
```

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: http://localhost:3001

### 3. Smart Contract (Optional)

```bash
cd contracts

# Install dependencies
npm install

# Start local blockchain
npm run node

# In another terminal, deploy contract
npm run deploy:local
```

Copy the contract address to `backend/.env`:
```
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...  # From Hardhat accounts
```

## MVP Access

Use one of these invitation tokens:
- `VAULT-2024`
- `ISSUANCE-MVP`
- `SOUND-REGISTRY`

Or use the passphrase: `SOUND IS ISSUED`

## Flows

### Landing → Registry
1. Open http://localhost:3001
2. Click "Enter"
3. Enter invitation token
4. View registry of issued assets

### Issue Sound (Hidden)
1. Navigate to http://localhost:3001/issue
2. Upload audio file (WAV, MP3, FLAC, AIFF, M4A)
3. Fill in metadata
4. Click "Issue Sound"
5. SINC processes the audio:
   - Extracts duration
   - Computes fingerprint hash
   - Checks against external providers (stubbed)
   - Assigns risk score and clearance status
6. If CLEARED, registers on blockchain (if configured)

### Asset Playback → Settlement
1. View asset detail page
2. Play audio to completion
3. Settlement event created
4. Asset status updates to SETTLED

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/validate | Validate invitation token |
| GET | /api/assets | List all assets |
| GET | /api/assets/:id | Get single asset |
| POST | /api/assets/issue | Issue new asset (multipart) |
| GET | /api/assets/:id/audio | Stream audio file |
| GET | /api/assets/:id/custody | Get custody chain |
| POST | /api/assets/:id/settlement | Create settlement event |
| GET | /api/assets/:id/settlements | Get settlement events |

## SINC Engine

The Sound Identification & Normalization Core (SINC) provides:

- **Fingerprinting**: MFCC-based audio fingerprint → SHA256 hash
- **Duration detection**: Accurate audio length extraction
- **Risk scoring**: External provider checks (stubbed)
- **Clearance status**: UNCHECKED → CLEARED / FLAGGED

External provider adapters (stubs):
- `sinc/providers/audible_magic.py`
- `sinc/providers/pex.py`

## Smart Contract

`IssuanceRegistry.sol` on Polygon:

```solidity
function registerAsset(
    uint256 assetId,
    bytes32 fingerprintHash,
    address owner,
    uint8 consentFlags
) external;

function getAsset(uint256 assetId) external view returns (
    bytes32 fingerprintHash,
    address owner,
    uint8 consentFlags,
    uint256 timestamp
);
```

Events:
- `AssetIssued(assetId, fingerprintHash, owner, timestamp)`
- `OwnershipTransferred(assetId, previousOwner, newOwner)`
- `ConsentUpdated(assetId, previousFlags, newFlags)`

## Design

The vault UI follows these principles:
- **Color**: Near-black backgrounds (#0A0A0A, #111111)
- **Typography**: Uppercase letter-spaced headers, clean sans-serif body
- **Accent**: Gold/brass (#C4A052) for important actions
- **Animation**: Subtle, smooth transitions via Framer Motion
- **Spacing**: Generous padding, minimal density

## Data Model

### Asset
- id, title, artist_display, year
- edition_total (1-21)
- duration_seconds
- provenance_text
- settlement_rule: IMMEDIATE | ON_FIRST_PLAY | ON_TRANSFER | CUSTOM
- status: ISSUED | SETTLED
- clearance_status: UNCHECKED | CLEARED | FLAGGED
- risk_score (0-1)
- fingerprint_hash (SHA256)
- verification ("SOVN Clean")
- chain_tx_hash

### CustodyEvent
- asset_id, from_holder_label, to_holder_label, occurred_at

### SettlementEvent
- asset_id, kind (PLAY | TRANSFER), occurred_at
