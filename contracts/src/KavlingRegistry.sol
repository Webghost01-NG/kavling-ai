// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title KavlingRegistry
 * @notice Central registry for Indonesian & SEA Real Estate Assets tokenized on BNB Chain.
 * @dev Validates AI Agent valuations using EIP-712 cryptographically signed appraisals.
 */
contract KavlingRegistry is Ownable, EIP712 {
    using ECDSA for bytes32;

    struct Appraisal {
        bytes32 propertyId;
        uint256 valuationUSD;     // 18 decimals, total appraisal in USD
        uint256 pricePerFraction; // 18 decimals, price per fractional token
        uint256 annualYieldBps;   // 100 bps = 1.00% expected APY (e.g. 850 = 8.50%)
        uint256 timestamp;
        uint256 deadline;
    }

    struct Property {
        bytes32 propertyId;
        string name;              // e.g. "Villa Canggu Sanctuary"
        string city;              // e.g. "Bali", "Jakarta", "Yogyakarta"
        string legalDeedHash;     // SHM / HGB land title hash
        string ipfsMetadata;      // IPFS URI containing images, comps, and full audit
        uint256 totalFractions;   // Total fractional tokens issued
        uint256 valuationUSD;
        uint256 pricePerFraction;
        uint256 annualYieldBps;
        address vaultAddress;     // Deployed KavlingPropertyVault
        bool isActive;
    }

    bytes32 public constant APPRAISAL_TYPEHASH = keccak256(
        "Appraisal(bytes32 propertyId,uint256 valuationUSD,uint256 pricePerFraction,uint256 annualYieldBps,uint256 timestamp,uint256 deadline)"
    );

    address public aiAppraiserAgent;
    mapping(bytes32 => Property) public properties;
    bytes32[] public propertyIds;

    event AIAppraiserUpdated(address indexed previousAgent, address indexed newAgent);
    event PropertyRegistered(
        bytes32 indexed propertyId,
        string name,
        string city,
        uint256 valuationUSD,
        uint256 pricePerFraction,
        uint256 annualYieldBps,
        address indexed vaultAddress
    );
    event AppraisalUpdated(
        bytes32 indexed propertyId,
        uint256 newValuationUSD,
        uint256 newPricePerFraction,
        uint256 newYieldBps,
        uint256 timestamp
    );
    event VaultLinked(bytes32 indexed propertyId, address indexed vaultAddress);

    error InvalidSigner();
    error SignatureExpired();
    error PropertyAlreadyExists();
    error PropertyNotFound();
    error Unauthorized();

    constructor(address _aiAppraiserAgent) 
        Ownable(msg.sender) 
        EIP712("KavlingRegistry", "1.0.0") 
    {
        aiAppraiserAgent = _aiAppraiserAgent;
    }

    function setAIAppraiser(address _newAgent) external onlyOwner {
        require(_newAgent != address(0), "Invalid agent address");
        emit AIAppraiserUpdated(aiAppraiserAgent, _newAgent);
        aiAppraiserAgent = _newAgent;
    }

    function _verifyAppraisalSignature(
        Appraisal calldata appraisal,
        bytes calldata signature
    ) internal view {
        if (block.timestamp > appraisal.deadline) revert SignatureExpired();

        bytes32 structHash = keccak256(
            abi.encode(
                APPRAISAL_TYPEHASH,
                appraisal.propertyId,
                appraisal.valuationUSD,
                appraisal.pricePerFraction,
                appraisal.annualYieldBps,
                appraisal.timestamp,
                appraisal.deadline
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address recoveredSigner = hash.recover(signature);
        if (recoveredSigner != aiAppraiserAgent) revert InvalidSigner();
    }

    /**
     * @notice Registers a new property with an AI-signed appraisal.
     */
    function registerPropertyWithAppraisal(
        bytes32 propertyId,
        string calldata name,
        string calldata city,
        string calldata legalDeedHash,
        string calldata ipfsMetadata,
        uint256 totalFractions,
        Appraisal calldata appraisal,
        bytes calldata signature
    ) external onlyOwner {
        if (properties[propertyId].valuationUSD != 0) revert PropertyAlreadyExists();
        if (appraisal.propertyId != propertyId) revert PropertyNotFound();

        _verifyAppraisalSignature(appraisal, signature);

        Property storage prop = properties[propertyId];
        prop.propertyId = propertyId;
        prop.name = name;
        prop.city = city;
        prop.legalDeedHash = legalDeedHash;
        prop.ipfsMetadata = ipfsMetadata;
        prop.totalFractions = totalFractions;
        prop.valuationUSD = appraisal.valuationUSD;
        prop.pricePerFraction = appraisal.pricePerFraction;
        prop.annualYieldBps = appraisal.annualYieldBps;
        prop.vaultAddress = address(0);
        prop.isActive = true;

        propertyIds.push(propertyId);

        emit PropertyRegistered(
            propertyId,
            name,
            city,
            appraisal.valuationUSD,
            appraisal.pricePerFraction,
            appraisal.annualYieldBps,
            address(0)
        );
    }

    /**
     * @notice Links the deployed fractional vault address to the registered property.
     */
    function linkVault(bytes32 propertyId, address vault) external onlyOwner {
        if (properties[propertyId].valuationUSD == 0) revert PropertyNotFound();
        properties[propertyId].vaultAddress = vault;
        emit VaultLinked(propertyId, vault);
    }

    /**
     * @notice Updates valuation when AI Agent re-appraises based on market comps.
     */
    function updateAppraisal(
        Appraisal calldata appraisal,
        bytes calldata signature
    ) external {
        if (properties[appraisal.propertyId].valuationUSD == 0) revert PropertyNotFound();

        _verifyAppraisalSignature(appraisal, signature);

        Property storage prop = properties[appraisal.propertyId];
        prop.valuationUSD = appraisal.valuationUSD;
        prop.pricePerFraction = appraisal.pricePerFraction;
        prop.annualYieldBps = appraisal.annualYieldBps;

        emit AppraisalUpdated(
            appraisal.propertyId,
            appraisal.valuationUSD,
            appraisal.pricePerFraction,
            appraisal.annualYieldBps,
            appraisal.timestamp
        );
    }

    function totalProperties() external view returns (uint256) {
        return propertyIds.length;
    }

    function getProperty(bytes32 propertyId) external view returns (Property memory) {
        return properties[propertyId];
    }
}
