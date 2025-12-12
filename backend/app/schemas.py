from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SettlementRule(str, Enum):
    IMMEDIATE = "IMMEDIATE"
    ON_FIRST_PLAY = "ON_FIRST_PLAY"
    ON_TRANSFER = "ON_TRANSFER"
    CUSTOM = "CUSTOM"


class AssetStatus(str, Enum):
    ISSUED = "ISSUED"
    SETTLED = "SETTLED"


class ClearanceStatus(str, Enum):
    UNCHECKED = "UNCHECKED"
    CLEARED = "CLEARED"
    FLAGGED = "FLAGGED"


class AssetCreate(BaseModel):
    title: str
    artist_display: str
    year: int
    edition_total: int = Field(ge=1, le=21)
    provenance_text: Optional[str] = None
    settlement_rule: SettlementRule = SettlementRule.IMMEDIATE


class AssetResponse(BaseModel):
    id: int
    title: str
    artist_display: str
    year: int
    edition_total: int
    duration_seconds: Optional[float]
    provenance_text: Optional[str]
    settlement_rule: str
    status: str
    clearance_status: str
    risk_score: Optional[float]
    fingerprint_hash: Optional[str]
    verification: str
    chain_tx_hash: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustodyEventResponse(BaseModel):
    id: int
    asset_id: int
    from_holder_label: str
    to_holder_label: str
    occurred_at: datetime

    class Config:
        from_attributes = True


class SettlementEventCreate(BaseModel):
    kind: str  # PLAY | TRANSFER


class SettlementEventResponse(BaseModel):
    id: int
    asset_id: int
    kind: str
    occurred_at: datetime

    class Config:
        from_attributes = True


class InvitationValidate(BaseModel):
    token: str


class InvitationResponse(BaseModel):
    valid: bool
    message: str


class SINCResult(BaseModel):
    fingerprint_hash: str
    duration_seconds: float
    risk_score: float
    clearance_status: str
