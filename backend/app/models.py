from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .database import Base


class SettlementRule(str, enum.Enum):
    IMMEDIATE = "IMMEDIATE"
    ON_FIRST_PLAY = "ON_FIRST_PLAY"
    ON_TRANSFER = "ON_TRANSFER"
    CUSTOM = "CUSTOM"


class AssetStatus(str, enum.Enum):
    ISSUED = "ISSUED"
    SETTLED = "SETTLED"


class ClearanceStatus(str, enum.Enum):
    UNCHECKED = "UNCHECKED"
    CLEARED = "CLEARED"
    FLAGGED = "FLAGGED"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    artist_display = Column(String(255), nullable=False)
    year = Column(Integer, nullable=False)
    edition_total = Column(Integer, nullable=False, default=1)
    duration_seconds = Column(Float, nullable=True)
    provenance_text = Column(Text, nullable=True)
    settlement_rule = Column(String(50), default=SettlementRule.IMMEDIATE.value)
    status = Column(String(50), default=AssetStatus.ISSUED.value)
    clearance_status = Column(String(50), default=ClearanceStatus.UNCHECKED.value)
    risk_score = Column(Float, nullable=True)
    fingerprint_hash = Column(String(64), nullable=True)
    verification = Column(String(100), default="SOVN Clean")
    chain_tx_hash = Column(String(66), nullable=True)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    custody_events = relationship("CustodyEvent", back_populates="asset")
    settlement_events = relationship("SettlementEvent", back_populates="asset")


class CustodyEvent(Base):
    __tablename__ = "custody_events"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    from_holder_label = Column(String(255), nullable=False)
    to_holder_label = Column(String(255), nullable=False)
    occurred_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="custody_events")


class SettlementEvent(Base):
    __tablename__ = "settlement_events"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    kind = Column(String(50), nullable=False)  # PLAY | TRANSFER
    occurred_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="settlement_events")


class InvitationToken(Base):
    __tablename__ = "invitation_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, nullable=False)
    used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
