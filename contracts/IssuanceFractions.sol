// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title IssuanceFractions
 * @notice ERC-1155 contract for fractional ownership of ISSUANCE sound assets
 * @dev Each token ID represents an asset, with multiple fungible fractions
 */
contract IssuanceFractions is ERC1155, Ownable, ReentrancyGuard {
    struct FractionalAsset {
        uint256 totalFractions;
        uint256 pricePerFraction;
        address originalOwner;
        bytes32 fingerprintHash;
        bool tradingEnabled;
        bool exists;
    }

    mapping(uint256 => FractionalAsset) public assets;
    mapping(uint256 => mapping(address => uint256)) public fractionBalances;

    // Trading
    struct Listing {
        address seller;
        uint256 amount;
        uint256 pricePerFraction;
        bool active;
    }

    mapping(uint256 => mapping(uint256 => Listing)) public listings; // assetId => listingId => Listing
    mapping(uint256 => uint256) public listingCount;

    // Events
    event AssetFractionalized(
        uint256 indexed assetId,
        address indexed owner,
        uint256 totalFractions,
        bytes32 fingerprintHash
    );

    event FractionsPurchased(
        uint256 indexed assetId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice
    );

    event FractionsListed(
        uint256 indexed assetId,
        uint256 indexed listingId,
        address indexed seller,
        uint256 amount,
        uint256 pricePerFraction
    );

    event ListingCancelled(
        uint256 indexed assetId,
        uint256 indexed listingId
    );

    event FractionsSold(
        uint256 indexed assetId,
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount
    );

    constructor() ERC1155("https://issuance.io/api/metadata/{id}.json") Ownable(msg.sender) {}

    /**
     * @notice Fractionalize a new sound asset
     * @param assetId Unique identifier for the asset
     * @param totalFractions Number of fractions to create
     * @param pricePerFraction Initial price per fraction in wei
     * @param fingerprintHash SINC fingerprint hash of the audio
     */
    function fractionalizeAsset(
        uint256 assetId,
        uint256 totalFractions,
        uint256 pricePerFraction,
        bytes32 fingerprintHash
    ) external {
        require(!assets[assetId].exists, "Asset already fractionalized");
        require(totalFractions > 0 && totalFractions <= 10000, "Invalid fraction count");
        require(fingerprintHash != bytes32(0), "Invalid fingerprint");

        assets[assetId] = FractionalAsset({
            totalFractions: totalFractions,
            pricePerFraction: pricePerFraction,
            originalOwner: msg.sender,
            fingerprintHash: fingerprintHash,
            tradingEnabled: false,
            exists: true
        });

        // Mint all fractions to the original owner
        _mint(msg.sender, assetId, totalFractions, "");
        fractionBalances[assetId][msg.sender] = totalFractions;

        emit AssetFractionalized(assetId, msg.sender, totalFractions, fingerprintHash);
    }

    /**
     * @notice Enable trading for an asset's fractions
     * @param assetId Asset identifier
     */
    function enableTrading(uint256 assetId) external {
        require(assets[assetId].exists, "Asset not found");
        require(assets[assetId].originalOwner == msg.sender, "Not asset owner");

        assets[assetId].tradingEnabled = true;
    }

    /**
     * @notice Purchase fractions directly from the original owner
     * @param assetId Asset identifier
     * @param amount Number of fractions to purchase
     */
    function purchaseFractions(uint256 assetId, uint256 amount) external payable nonReentrant {
        FractionalAsset storage asset = assets[assetId];
        require(asset.exists, "Asset not found");
        require(asset.tradingEnabled, "Trading not enabled");

        uint256 totalPrice = amount * asset.pricePerFraction;
        require(msg.value >= totalPrice, "Insufficient payment");

        address owner = asset.originalOwner;
        require(balanceOf(owner, assetId) >= amount, "Insufficient fractions available");

        // Transfer fractions
        _safeTransferFrom(owner, msg.sender, assetId, amount, "");
        fractionBalances[assetId][owner] -= amount;
        fractionBalances[assetId][msg.sender] += amount;

        // Transfer payment to owner
        payable(owner).transfer(totalPrice);

        // Refund excess
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        emit FractionsPurchased(assetId, msg.sender, amount, totalPrice);
    }

    /**
     * @notice List fractions for sale on secondary market
     * @param assetId Asset identifier
     * @param amount Number of fractions to list
     * @param pricePerFraction Price per fraction in wei
     */
    function listFractions(
        uint256 assetId,
        uint256 amount,
        uint256 pricePerFraction
    ) external {
        require(assets[assetId].exists, "Asset not found");
        require(assets[assetId].tradingEnabled, "Trading not enabled");
        require(balanceOf(msg.sender, assetId) >= amount, "Insufficient balance");

        uint256 listingId = listingCount[assetId]++;

        listings[assetId][listingId] = Listing({
            seller: msg.sender,
            amount: amount,
            pricePerFraction: pricePerFraction,
            active: true
        });

        emit FractionsListed(assetId, listingId, msg.sender, amount, pricePerFraction);
    }

    /**
     * @notice Cancel a listing
     * @param assetId Asset identifier
     * @param listingId Listing identifier
     */
    function cancelListing(uint256 assetId, uint256 listingId) external {
        Listing storage listing = listings[assetId][listingId];
        require(listing.seller == msg.sender, "Not listing owner");
        require(listing.active, "Listing not active");

        listing.active = false;

        emit ListingCancelled(assetId, listingId);
    }

    /**
     * @notice Buy fractions from a listing
     * @param assetId Asset identifier
     * @param listingId Listing identifier
     * @param amount Number of fractions to buy
     */
    function buyFromListing(
        uint256 assetId,
        uint256 listingId,
        uint256 amount
    ) external payable nonReentrant {
        Listing storage listing = listings[assetId][listingId];
        require(listing.active, "Listing not active");
        require(amount <= listing.amount, "Amount exceeds listing");

        uint256 totalPrice = amount * listing.pricePerFraction;
        require(msg.value >= totalPrice, "Insufficient payment");

        address seller = listing.seller;
        require(balanceOf(seller, assetId) >= amount, "Seller has insufficient balance");

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        // Transfer fractions
        _safeTransferFrom(seller, msg.sender, assetId, amount, "");
        fractionBalances[assetId][seller] -= amount;
        fractionBalances[assetId][msg.sender] += amount;

        // Transfer payment (2% platform fee)
        uint256 fee = totalPrice * 2 / 100;
        uint256 sellerAmount = totalPrice - fee;

        payable(seller).transfer(sellerAmount);
        payable(owner()).transfer(fee);

        // Refund excess
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        emit FractionsSold(assetId, listingId, msg.sender, amount);
    }

    /**
     * @notice Get ownership percentage for an address
     * @param assetId Asset identifier
     * @param holder Address to check
     * @return Ownership percentage (basis points, 10000 = 100%)
     */
    function getOwnershipPercentage(uint256 assetId, address holder) external view returns (uint256) {
        if (!assets[assetId].exists) return 0;
        uint256 balance = balanceOf(holder, assetId);
        return (balance * 10000) / assets[assetId].totalFractions;
    }

    /**
     * @notice Get asset details
     * @param assetId Asset identifier
     */
    function getAssetDetails(uint256 assetId) external view returns (
        uint256 totalFractions,
        uint256 pricePerFraction,
        address originalOwner,
        bytes32 fingerprintHash,
        bool tradingEnabled
    ) {
        FractionalAsset storage asset = assets[assetId];
        return (
            asset.totalFractions,
            asset.pricePerFraction,
            asset.originalOwner,
            asset.fingerprintHash,
            asset.tradingEnabled
        );
    }

    /**
     * @notice Update URI base
     * @param newuri New URI template
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}
