// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IssuanceRegistry
 * @notice Minimal on-chain registry for ISSUANCE sound assets
 * @dev Stores fingerprint hash, owner, consent flags, and timestamp
 */
contract IssuanceRegistry {
    struct RegisteredAsset {
        bytes32 fingerprintHash;
        address owner;
        uint8 consentFlags;
        uint256 timestamp;
        bool exists;
    }

    mapping(uint256 => RegisteredAsset) public assets;

    event AssetIssued(
        uint256 indexed assetId,
        bytes32 fingerprintHash,
        address indexed owner,
        uint256 timestamp
    );

    event OwnershipTransferred(
        uint256 indexed assetId,
        address indexed previousOwner,
        address indexed newOwner
    );

    event ConsentUpdated(
        uint256 indexed assetId,
        uint8 previousFlags,
        uint8 newFlags
    );

    modifier assetExists(uint256 assetId) {
        require(assets[assetId].exists, "Asset not registered");
        _;
    }

    modifier onlyOwner(uint256 assetId) {
        require(assets[assetId].owner == msg.sender, "Not asset owner");
        _;
    }

    /**
     * @notice Register a new sound asset
     * @param assetId Unique identifier for the asset
     * @param fingerprintHash SHA256 hash of audio fingerprint
     * @param owner Address of the asset owner
     * @param consentFlags Bitfield for consent permissions
     */
    function registerAsset(
        uint256 assetId,
        bytes32 fingerprintHash,
        address owner,
        uint8 consentFlags
    ) external {
        require(!assets[assetId].exists, "Asset already registered");
        require(owner != address(0), "Invalid owner address");
        require(fingerprintHash != bytes32(0), "Invalid fingerprint");

        assets[assetId] = RegisteredAsset({
            fingerprintHash: fingerprintHash,
            owner: owner,
            consentFlags: consentFlags,
            timestamp: block.timestamp,
            exists: true
        });

        emit AssetIssued(assetId, fingerprintHash, owner, block.timestamp);
    }

    /**
     * @notice Get asset registration details
     * @param assetId Asset identifier
     * @return fingerprintHash The fingerprint hash
     * @return owner The owner address
     * @return consentFlags The consent bitfield
     * @return timestamp Registration timestamp
     */
    function getAsset(uint256 assetId)
        external
        view
        assetExists(assetId)
        returns (
            bytes32 fingerprintHash,
            address owner,
            uint8 consentFlags,
            uint256 timestamp
        )
    {
        RegisteredAsset memory asset = assets[assetId];
        return (
            asset.fingerprintHash,
            asset.owner,
            asset.consentFlags,
            asset.timestamp
        );
    }

    /**
     * @notice Transfer asset ownership
     * @param assetId Asset identifier
     * @param newOwner New owner address
     */
    function transferOwnership(uint256 assetId, address newOwner)
        external
        assetExists(assetId)
        onlyOwner(assetId)
    {
        require(newOwner != address(0), "Invalid new owner");

        address previousOwner = assets[assetId].owner;
        assets[assetId].owner = newOwner;

        emit OwnershipTransferred(assetId, previousOwner, newOwner);
    }

    /**
     * @notice Update consent flags
     * @param assetId Asset identifier
     * @param newFlags New consent bitfield
     */
    function updateConsent(uint256 assetId, uint8 newFlags)
        external
        assetExists(assetId)
        onlyOwner(assetId)
    {
        uint8 previousFlags = assets[assetId].consentFlags;
        assets[assetId].consentFlags = newFlags;

        emit ConsentUpdated(assetId, previousFlags, newFlags);
    }

    /**
     * @notice Check if asset is registered
     * @param assetId Asset identifier
     * @return bool True if registered
     */
    function isRegistered(uint256 assetId) external view returns (bool) {
        return assets[assetId].exists;
    }

    /**
     * @notice Verify fingerprint matches registered asset
     * @param assetId Asset identifier
     * @param fingerprintHash Hash to verify
     * @return bool True if fingerprint matches
     */
    function verifyFingerprint(uint256 assetId, bytes32 fingerprintHash)
        external
        view
        assetExists(assetId)
        returns (bool)
    {
        return assets[assetId].fingerprintHash == fingerprintHash;
    }
}
