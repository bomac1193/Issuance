"""
Blockchain integration for Polygon registry
"""

import os
import json
from typing import Optional
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# Contract ABI (minimal for IssuanceRegistry)
CONTRACT_ABI = [
    {
        "inputs": [
            {"name": "assetId", "type": "uint256"},
            {"name": "fingerprintHash", "type": "bytes32"},
            {"name": "owner", "type": "address"},
            {"name": "consentFlags", "type": "uint8"}
        ],
        "name": "registerAsset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "assetId", "type": "uint256"}],
        "name": "getAsset",
        "outputs": [
            {"name": "fingerprintHash", "type": "bytes32"},
            {"name": "owner", "type": "address"},
            {"name": "consentFlags", "type": "uint8"},
            {"name": "timestamp", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "assetId", "type": "uint256"},
            {"indexed": False, "name": "fingerprintHash", "type": "bytes32"},
            {"indexed": True, "name": "owner", "type": "address"},
            {"indexed": False, "name": "timestamp", "type": "uint256"}
        ],
        "name": "AssetIssued",
        "type": "event"
    }
]


class BlockchainRegistry:
    def __init__(self):
        self.rpc_url = os.getenv("POLYGON_RPC_URL", "http://127.0.0.1:8545")
        self.contract_address = os.getenv("CONTRACT_ADDRESS", "")
        self.private_key = os.getenv("PRIVATE_KEY", "")
        self.w3 = None
        self.contract = None

        if self.contract_address and self.private_key:
            try:
                self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=CONTRACT_ABI
                )
            except Exception as e:
                print(f"Blockchain init error: {e}")

    def is_available(self) -> bool:
        return self.w3 is not None and self.w3.is_connected()

    def register_asset(
        self,
        asset_id: int,
        fingerprint_hash: str,
        owner_address: Optional[str] = None,
        consent_flags: int = 0xFF
    ) -> Optional[str]:
        """
        Register asset on blockchain.

        Returns:
            Transaction hash if successful, None otherwise
        """
        if not self.is_available():
            print("Blockchain not available, skipping registration")
            return None

        try:
            # Get account from private key
            account = self.w3.eth.account.from_key(self.private_key)
            owner = owner_address or account.address

            # Convert fingerprint hash to bytes32
            if fingerprint_hash.startswith("0x"):
                fp_bytes = bytes.fromhex(fingerprint_hash[2:])
            else:
                fp_bytes = bytes.fromhex(fingerprint_hash)

            # Build transaction
            nonce = self.w3.eth.get_transaction_count(account.address)

            tx = self.contract.functions.registerAsset(
                asset_id,
                fp_bytes,
                Web3.to_checksum_address(owner),
                consent_flags
            ).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price
            })

            # Sign and send
            signed = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)

            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return receipt.transactionHash.hex()

        except Exception as e:
            print(f"Blockchain registration error: {e}")
            return None

    def get_asset(self, asset_id: int) -> Optional[dict]:
        """
        Get asset from blockchain registry.
        """
        if not self.is_available():
            return None

        try:
            result = self.contract.functions.getAsset(asset_id).call()
            return {
                "fingerprintHash": result[0].hex(),
                "owner": result[1],
                "consentFlags": result[2],
                "timestamp": result[3]
            }
        except Exception as e:
            print(f"Blockchain get error: {e}")
            return None


# Singleton instance
registry = BlockchainRegistry()
