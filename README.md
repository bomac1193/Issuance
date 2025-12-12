# ISSUANCE

Luxury sound registry platform. Sound is issued as art assets with scarcity, provenance, and settlement.

## Architecture

```
issuance/
├── frontend/          # Next.js + TypeScript + Tailwind + Framer Motion
├── backend/           # FastAPI + SQLite
├── sinc/              # SINC fingerprinting engine (Python)
├── contracts/         # Solidity smart contracts (Polygon)
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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Backend runs at: http://localhost:8001

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: http://localhost:3001

### 3. Smart Contracts (Optional)

```bash
cd contracts

# Install dependencies
npm install

# Start local blockchain
npm run node

# In another terminal, deploy all contracts
npm run deploy:all:local
```

Copy the contract addresses to `backend/.env`:
```
CONTRACT_ADDRESS=0x...
FRACTIONS_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...  # From Hardhat accounts
```

## MVP Access

Use one of these invitation tokens:
- `VAULT-2024`
- `ISSUANCE-MVP`
- `SOUND-REGISTRY`

Or use the passphrase: `SOUND IS ISSUED`

## Features

### Ceremony Flow (Issue Sound)
1. Navigate to http://localhost:3001/ceremony
2. Upload audio file (WAV, MP3, FLAC, AIFF, M4A)
3. Fill in metadata (title, artist, year, edition, settlement rule)
4. SINC verifies the audio:
   - Generates fingerprint hash
   - Checks rights clearance
   - Prepares blockchain registration
5. Issue to blockchain

### Settlement
- **IMMEDIATE**: Settles upon issuance
- **ON_FIRST_PLAY**: Settles when played for the first time
- **ON_TRANSFER**: Settles when ownership transfers
- **CUSTOM**: Define custom settlement logic

### Fractional Ownership (ERC-1155)
- Enable fractionalization for cleared assets
- Split into 2-10,000 tradeable fractions
- Secondary market trading on Polygon
- Automatic ownership percentage tracking

### KYC/AML Compliance
- Required for fractionalized assets
- Required for high-value transactions (>$10,000)
- Country restrictions for sanctioned jurisdictions
- Verification levels: Basic, Enhanced

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/validate | Validate invitation token |

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/assets | List all assets |
| GET | /api/assets/:id | Get single asset |
| POST | /api/assets/issue | Issue new asset (multipart) |
| GET | /api/assets/:id/audio | Stream audio file |
| GET | /api/assets/:id/custody | Get custody chain |
| POST | /api/assets/:id/settlement | Create settlement event |
| GET | /api/assets/:id/settlements | Get settlement events |

### Fractional Ownership
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/assets/:id/fractionalize | Fractionalize an asset |
| GET | /api/assets/:id/fractions | Get fraction holdings |

### KYC/AML
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/kyc/submit | Submit KYC verification |
| GET | /api/kyc/:wallet | Get KYC status |
| POST | /api/kyc/:wallet/verify | Verify KYC (admin) |

## Smart Contracts

### IssuanceRegistry.sol
Main registry for sound assets on Polygon.

```solidity
function registerAsset(uint256 assetId, bytes32 fingerprintHash, address owner, uint8 consentFlags)
function getAsset(uint256 assetId) returns (bytes32, address, uint8, uint256)
function transferOwnership(uint256 assetId, address newOwner)
function updateConsent(uint256 assetId, uint8 newFlags)
```

### IssuanceFractions.sol (ERC-1155)
Fractional ownership contract.

```solidity
function fractionalizeAsset(uint256 assetId, uint256 totalFractions, uint256 pricePerFraction, bytes32 fingerprintHash)
function purchaseFractions(uint256 assetId, uint256 amount)
function listFractions(uint256 assetId, uint256 amount, uint256 pricePerFraction)
function buyFromListing(uint256 assetId, uint256 listingId, uint256 amount)
function getOwnershipPercentage(uint256 assetId, address holder) returns (uint256)
```

## SINC Engine

The Sound Identification & Normalization Core (SINC) provides:

- **Fingerprinting**: MFCC-based audio fingerprint → SHA256 hash
- **Duration detection**: Accurate audio length extraction
- **Risk scoring**: External provider checks
- **Clearance status**: UNCHECKED → CLEARED / FLAGGED

External provider adapters (stubs):
- `sinc/providers/audible_magic.py`
- `sinc/providers/pex.py`

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
- verification ("ISSUANCE Clean")
- chain_tx_hash
- is_fractionalized, fraction_count, fractions_tx_hash

### FractionHolding
- asset_id, holder_address, holder_label
- fraction_amount, percentage

### KYCRecord
- wallet_address, status, verification_level
- country_code, verified_at

### CustodyEvent
- asset_id, from_holder_label, to_holder_label, occurred_at

### SettlementEvent
- asset_id, kind (PLAY | TRANSFER), occurred_at

## Pages

- `/` - Landing page with invitation
- `/registry` - Asset registry listing
- `/ceremony` - Issue new sound asset
- `/asset/[id]` - Asset detail with player
- `/settlement/[id]` - Settlement management
- `/issue` - Legacy issue page (hidden)
