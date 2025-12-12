"""
ISSUANCE Backend API
"""

import os
import sys
import secrets
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

# Add sinc to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from .database import engine, get_db, Base
from .models import Asset, CustodyEvent, SettlementEvent, InvitationToken
from .schemas import (
    AssetCreate, AssetResponse, CustodyEventResponse,
    SettlementEventCreate, SettlementEventResponse,
    InvitationValidate, InvitationResponse, SINCResult
)
from .blockchain import registry as blockchain_registry

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ISSUANCE",
    description="Luxury Sound Registry Platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# MVP Invitation tokens (in production, these would be in DB)
MVP_TOKENS = {"VAULT-2024", "ISSUANCE-MVP", "SOUND-REGISTRY"}
MVP_PASSPHRASE = "SOUND IS ISSUED"


def validate_invitation(authorization: Optional[str] = Header(None)):
    """Validate invitation token for protected routes."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Invitation required")

    token = authorization.replace("Bearer ", "").strip()
    if token not in MVP_TOKENS and token != MVP_PASSPHRASE:
        raise HTTPException(status_code=403, detail="Invalid invitation")

    return token


@app.get("/")
async def root():
    return {"name": "ISSUANCE", "status": "operational"}


@app.post("/api/auth/validate", response_model=InvitationResponse)
async def validate_token(data: InvitationValidate, db: Session = Depends(get_db)):
    """Validate invitation token or passphrase."""
    token = data.token.strip()

    if token in MVP_TOKENS or token == MVP_PASSPHRASE:
        return {"valid": True, "message": "Access granted"}

    # Check database tokens
    db_token = db.query(InvitationToken).filter(
        InvitationToken.token == token,
        InvitationToken.used == 0
    ).first()

    if db_token:
        return {"valid": True, "message": "Access granted"}

    return {"valid": False, "message": "Invalid invitation"}


@app.get("/api/assets", response_model=List[AssetResponse])
async def list_assets(
    db: Session = Depends(get_db),
    _: str = Depends(validate_invitation)
):
    """List all issued assets."""
    assets = db.query(Asset).order_by(Asset.created_at.desc()).all()
    return assets


@app.get("/api/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(validate_invitation)
):
    """Get single asset by ID."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@app.post("/api/assets/issue", response_model=AssetResponse)
async def issue_asset(
    title: str = Form(...),
    artist_display: str = Form(...),
    year: int = Form(...),
    edition_total: int = Form(1),
    provenance_text: Optional[str] = Form(None),
    settlement_rule: str = Form("IMMEDIATE"),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: str = Depends(validate_invitation)
):
    """Issue a new sound asset."""
    if edition_total < 1 or edition_total > 21:
        raise HTTPException(status_code=400, detail="Edition must be 1-21")

    # Save audio file
    file_ext = Path(audio_file.filename).suffix.lower()
    if file_ext not in [".wav", ".mp3", ".flac", ".aiff", ".m4a"]:
        raise HTTPException(status_code=400, detail="Invalid audio format")

    file_id = secrets.token_hex(16)
    file_path = UPLOAD_DIR / f"{file_id}{file_ext}"

    content = await audio_file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Create asset
    asset = Asset(
        title=title,
        artist_display=artist_display,
        year=year,
        edition_total=edition_total,
        provenance_text=provenance_text,
        settlement_rule=settlement_rule,
        file_path=str(file_path)
    )

    db.add(asset)
    db.commit()
    db.refresh(asset)

    # Create initial custody event
    custody_event = CustodyEvent(
        asset_id=asset.id,
        from_holder_label="Origin",
        to_holder_label="Vault"
    )
    db.add(custody_event)
    db.commit()

    # Run SINC analysis in background (for MVP, sync)
    try:
        from sinc.fingerprint import analyze_audio
        sinc_result = analyze_audio(str(file_path))

        asset.fingerprint_hash = sinc_result["fingerprint_hash"]
        asset.duration_seconds = sinc_result["duration_seconds"]
        asset.risk_score = sinc_result["risk_score"]
        asset.clearance_status = sinc_result["clearance_status"]

        # If cleared, register on blockchain
        if sinc_result["clearance_status"] == "CLEARED":
            tx_hash = blockchain_registry.register_asset(
                asset.id,
                sinc_result["fingerprint_hash"]
            )
            if tx_hash:
                asset.chain_tx_hash = tx_hash

        db.commit()
        db.refresh(asset)

    except Exception as e:
        print(f"SINC analysis error: {e}")
        # Continue without fingerprint

    return asset


@app.get("/api/assets/{asset_id}/audio")
async def get_audio(
    asset_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(validate_invitation)
):
    """Stream audio file for asset."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset or not asset.file_path:
        raise HTTPException(status_code=404, detail="Audio not found")

    file_path = Path(asset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file missing")

    return FileResponse(
        file_path,
        media_type="audio/mpeg",
        filename=f"{asset.title}.mp3"
    )


@app.get("/api/assets/{asset_id}/custody", response_model=List[CustodyEventResponse])
async def get_custody_chain(
    asset_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(validate_invitation)
):
    """Get custody chain for asset."""
    events = db.query(CustodyEvent).filter(
        CustodyEvent.asset_id == asset_id
    ).order_by(CustodyEvent.occurred_at.asc()).all()

    return events


@app.post("/api/assets/{asset_id}/settlement", response_model=SettlementEventResponse)
async def create_settlement(
    asset_id: int,
    data: SettlementEventCreate,
    db: Session = Depends(get_db),
    _: str = Depends(validate_invitation)
):
    """Create settlement event (on play completion or transfer)."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    event = SettlementEvent(
        asset_id=asset_id,
        kind=data.kind
    )
    db.add(event)

    # Update asset status based on settlement rule
    if asset.settlement_rule == "IMMEDIATE":
        asset.status = "SETTLED"
    elif asset.settlement_rule == "ON_FIRST_PLAY" and data.kind == "PLAY":
        asset.status = "SETTLED"
    elif asset.settlement_rule == "ON_TRANSFER" and data.kind == "TRANSFER":
        asset.status = "SETTLED"

    db.commit()
    db.refresh(event)

    return event


@app.get("/api/assets/{asset_id}/settlements", response_model=List[SettlementEventResponse])
async def get_settlements(
    asset_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(validate_invitation)
):
    """Get settlement events for asset."""
    events = db.query(SettlementEvent).filter(
        SettlementEvent.asset_id == asset_id
    ).order_by(SettlementEvent.occurred_at.desc()).all()

    return events


@app.post("/api/admin/tokens")
async def create_invitation_token(
    db: Session = Depends(get_db),
    _: str = Depends(validate_invitation)
):
    """Create new invitation token (admin only)."""
    token = secrets.token_hex(16)
    db_token = InvitationToken(token=token)
    db.add(db_token)
    db.commit()

    return {"token": token}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
