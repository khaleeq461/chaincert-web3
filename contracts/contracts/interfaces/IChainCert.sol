// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IChainCert
 * @notice Complete interface for the ChainCert decentralized certificate registry.
 * @author Khaleeq ur Rahman & Shahab
 */
interface IChainCert {
    /// @notice Certificate verification lifecycle status
    enum Status {
        NOT_FOUND, // Certificate does not exist in registry
        VERIFIED,  // Certificate is authentic, active, and valid
        REVOKED,   // Certificate was revoked by an authorized authority
        EXPIRED    // Certificate validity period has expired
    }

    /// @notice On-chain certificate record
    struct Certificate {
        string certificateId;      // Unique human-readable ID (e.g., CC-2026-000001)
        address recipient;         // Recipient wallet address
        address issuer;            // Authorized issuing institution address
        string metadataURI;        // IPFS URI containing metadata JSON (ipfs://...)
        bytes32 certificateHash;   // Cryptographic SHA-256 / keccak256 hash of certificate payload
        uint64 issuedAt;           // Unix timestamp of issuance
        uint64 expiresAt;          // Unix timestamp of expiry (0 = lifetime validity)
        bool revoked;              // True if revoked
        uint64 revokedAt;          // Unix timestamp of revocation (0 if not revoked)
        string revocationReason;   // Documented reason for revocation
    }

    /// @notice Platform summary metrics
    struct PlatformStats {
        uint256 totalCertificates;
        uint256 totalIssuers;
        uint256 activeCertificates;
        uint256 revokedCertificates;
    }

    // ==========================================
    // EVENTS
    // ==========================================

    event CertificateIssued(
        string indexed certificateId,
        address indexed recipient,
        address indexed issuer,
        bytes32 certificateHash,
        string metadataURI,
        uint64 issuedAt,
        uint64 expiresAt
    );

    event CertificateRevoked(
        string indexed certificateId,
        address indexed issuer,
        uint64 revokedAt,
        string reason
    );

    event IssuerAuthorized(
        address indexed issuer,
        string institutionName,
        uint64 authorizedAt
    );

    event IssuerRevoked(
        address indexed issuer,
        uint64 revokedAt
    );

    // ==========================================
    // CUSTOM ERRORS
    // ==========================================

    error ZeroAddressNotAllowed();
    error CertificateAlreadyExists(string certificateId);
    error CertificateDoesNotExist(string certificateId);
    error UnauthorizedRevocation(address caller);
    error CertificateAlreadyRevoked(string certificateId);
    error InvalidRecipientAddress();
    error InvalidCertificateId();
    error InvalidMetadataURI();
    error InvalidCertificateHash();
    error InvalidExpirationDate();
    error InvalidInstitutionName();
    error InvalidRevocationReason();
    error IssuerAlreadyAuthorized(address issuer);
    error IssuerNotAuthorized(address issuer);

    // ==========================================
    // FUNCTIONS
    // ==========================================

    // Issuer Management
    function authorizeIssuer(address issuer, string calldata institutionName) external;
    function deactivateIssuer(address issuer) external;
    function isIssuerAuthorized(address issuer) external view returns (bool);
    function getInstitutionName(address issuer) external view returns (string memory);
    function getAllIssuers() external view returns (address[] memory);
    function totalIssuers() external view returns (uint256);

    // Certificate Lifecycle
    function issueCertificate(
        string calldata certificateId,
        address recipient,
        string calldata metadataURI,
        bytes32 certificateHash,
        uint64 expiresAt
    ) external;

    function revokeCertificate(string calldata certificateId, string calldata reason) external;

    // Queries & Verification
    function getCertificate(string calldata certificateId) external view returns (Certificate memory);
    function isCertificateValid(string calldata certificateId) external view returns (bool isValid, Status status);
    function certificateExists(string calldata certificateId) external view returns (bool);
    function getCertificateStatusString(string calldata certificateId) external view returns (string memory);

    // Enumeration & Dashboards
    function totalCertificates() external view returns (uint256);
    function getAllCertificateIds() external view returns (string[] memory);
    function getCertificatesByIssuer(address issuer) external view returns (string[] memory);
    function getCertificatesByRecipient(address recipient) external view returns (string[] memory);
    function getPlatformStats() external view returns (PlatformStats memory);
}
