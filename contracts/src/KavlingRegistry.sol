// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title KavlingRegistry
 * @notice Central registry for Indonesian & SEA Real Estate Assets tokenized on BNB Chain.
 * @dev Validates AI Agent valuations using EIP-712 cryptographically signed appraisals and manages investor compliance.
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
        string legalDeedHash;     // SHM / HGB land title certificate hash
        string ipfsMetadata;      // IPFS URI containing images, comps, and structural audit
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
    bool public complianceEnforced; // When true, only verified investors can purchase fractions

    mapping(bytes32 => Property) public properties;
    mapping(address => bool) public isInvestorVerified;
    bytes32[] public propertyIds;

    event AIAppraiserUpdated(address indexed previousAgent, address indexed newAgent);
    event ComplianceEnforcementToggled(bool isEnforced);
    event InvestorVerificationUpdated(address indexed investor, bool status);
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
    event PropertyStatusToggled(bytes32 indexed propertyId, bool isActive);

    error InvalidSigner();
    error SignatureExpired();
    error PropertyAlreadyExists();
    error PropertyNotFound();
    error Unauthorized();
    error InvestorNotVerified();

    constructor(address _aiAppraiserAgent) 
        Ownable(msg.sender) 
        EIP712("KavlingRegistry", "1.0.0") 
    {
        require(_aiAppraiserAgent != address(0), "Invalid agent address");
        aiAppraiserAgent = _aiAppraiserAgent;
        complianceEnforced = false; // Permissive by default for hackathon usability
    }

    function setAIAppraiser(address _newAgent) external onlyOwner {
        require(_newAgent != address(0), "Invalid agent address");
        emit AIAppraiserUpdated(aiAppraiserAgent, _newAgent);
        aiAppraiserAgent = _newAgent;
    }

    function setComplianceEnforced(bool _enforced) external onlyOwner {
        complianceEnforced = _enforced;
        emit ComplianceEnforcementToggled(_enforced);
    }

    function setInvestorVerification(address investor, bool status) external onlyOwner {
        isInvestorVerified[investor] = status;
        emit InvestorVerificationUpdated(investor, status);
    }

    function batchSetInvestorVerification(address[] calldata investors, bool status) external onlyOwner {
        for (uint256 i = 0; i < investors.length; i++) {
            isInvestorVerified[investors[i]] = status;
            emit InvestorVerificationUpdated(investors[i], status);
        }
    }

    function verifyInvestor(address investor) external view returns (bool) {
        if (!complianceEnforced) return true;
        return isInvestorVerified[investor];
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
     * @notice Registers a new property parcel on BNB Chain with verified AI appraisal.
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

    function setPropertyActive(bytes32 propertyId, bool active) external onlyOwner {
        if (properties[propertyId].valuationUSD == 0) revert PropertyNotFound();
        properties[propertyId].isActive = active;
        emit PropertyStatusToggled(propertyId, active);
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
