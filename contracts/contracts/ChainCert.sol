// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IChainCert.sol";

/**
 * @title ChainCert
 * @notice Complete, production-grade decentralized certificate registry smart contract.
 * @dev Enforces role-based access control (Admin & Issuer), cryptographic validation,
 *      lifecycle management (Issued -> Active -> Revoked / Expired), and gas-optimized storage.
 * @author Khaleeq ur Rahman & Shahab
 */
contract ChainCert is IChainCert, AccessControl, ReentrancyGuard {
    /// @notice Role identifier for authorized educational institutions and certification authorities
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    // ==========================================
    // STORAGE
    // ==========================================

    // Mapping: certificateId => Certificate struct
    mapping(string => Certificate) private _certificates;
    // Mapping: certificateId => existence boolean
    mapping(string => bool) private _certificateExists;
    // Mapping: issuer address => institution name
    mapping(address => string) private _institutionNames;
    // Mapping: issuer address => registration timestamp
    mapping(address => uint64) private _issuerAuthorizedAt;
    // Mapping: issuer address => has ever been registered in _allIssuers
    mapping(address => bool) private _isKnownIssuer;

    // Indexing arrays for dashboard queries
    string[] private _allCertificateIds;
    address[] private _allIssuers;
    mapping(address => string[]) private _issuerCertificates;
    mapping(address => string[]) private _recipientCertificates;

    // Counters for O(1) platform statistics
    uint256 private _revokedCertificatesCount;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    /**
     * @notice Initializes the ChainCert contract and assigns the default admin role.
     * @param initialAdmin Address of the platform owner/administrator.
     */
    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) revert ZeroAddressNotAllowed();
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
    }

    // ==========================================
    // ISSUER MANAGEMENT (ADMIN ONLY)
    // ==========================================

    /**
     * @notice Authorizes an educational institution to issue certificates.
     * @dev Only accounts with DEFAULT_ADMIN_ROLE can call this function.
     * @param issuer The wallet address of the institution.
     * @param institutionName The legal/display name of the institution.
     */
    function authorizeIssuer(
        address issuer,
        string calldata institutionName
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (issuer == address(0) || issuer == address(this)) revert ZeroAddressNotAllowed();
        if (bytes(institutionName).length == 0 || bytes(institutionName).length > 128) revert InvalidInstitutionName();
        if (hasRole(ISSUER_ROLE, issuer)) revert IssuerAlreadyAuthorized(issuer);


        _grantRole(ISSUER_ROLE, issuer);
        _institutionNames[issuer] = institutionName;
        _issuerAuthorizedAt[issuer] = uint64(block.timestamp);

        if (!_isKnownIssuer[issuer]) {
            _isKnownIssuer[issuer] = true;
            _allIssuers.push(issuer);
        }

        emit IssuerAuthorized(issuer, institutionName, uint64(block.timestamp));
    }

    /**
     * @notice Deactivates an institution's issuing privileges.
     * @dev Only accounts with DEFAULT_ADMIN_ROLE can call this function.
     * @param issuer The wallet address to revoke permissions from.
     */
    function deactivateIssuer(
        address issuer
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (issuer == address(0)) revert ZeroAddressNotAllowed();
        if (!hasRole(ISSUER_ROLE, issuer)) revert IssuerNotAuthorized(issuer);

        _revokeRole(ISSUER_ROLE, issuer);

        emit IssuerRevoked(issuer, uint64(block.timestamp));
    }

    /**
     * @notice Checks if an address is an active authorized issuer.
     * @param issuer Address to check.
     */
    function isIssuerAuthorized(address issuer) external view override returns (bool) {
        return hasRole(ISSUER_ROLE, issuer);
    }

    /**
     * @notice Retrieves the institution name associated with an issuer address.
     * @param issuer Address of the issuer.
     */
    function getInstitutionName(address issuer) external view override returns (string memory) {
        return _institutionNames[issuer];
    }

    /**
     * @notice Returns the list of all registered issuer addresses.
     */
    function getAllIssuers() external view override returns (address[] memory) {
        return _allIssuers;
    }

    /**
     * @notice Returns total number of registered issuers.
     */
    function totalIssuers() external view override returns (uint256) {
        return _allIssuers.length;
    }

    // ==========================================
    // CERTIFICATE ISSUANCE (ISSUER ONLY)
    // ==========================================

    /**
     * @notice Issues a new verifiable certificate on-chain.
     * @dev Only accounts with ISSUER_ROLE can issue certificates.
     * @param certificateId Unique alphanumeric identifier (e.g. "CC-2026-000001").
     * @param recipient Recipient's wallet address.
     * @param metadataURI IPFS URI containing metadata JSON payload (e.g. "ipfs://Qm...").
     * @param certificateHash Cryptographic digest (SHA-256 / keccak256) of the metadata/document.
     * @param expiresAt Unix timestamp when certificate expires (0 for lifetime validity).
     */
    function issueCertificate(
        string calldata certificateId,
        address recipient,
        string calldata metadataURI,
        bytes32 certificateHash,
        uint64 expiresAt
    ) external override onlyRole(ISSUER_ROLE) nonReentrant {
        if (bytes(certificateId).length < 3 || bytes(certificateId).length > 64) revert InvalidCertificateId();
        if (recipient == address(0) || recipient == address(this)) revert InvalidRecipientAddress();
        if (bytes(metadataURI).length == 0 || bytes(metadataURI).length > 256) revert InvalidMetadataURI();
        if (certificateHash == bytes32(0)) revert InvalidCertificateHash();
        if (_certificateExists[certificateId]) revert CertificateAlreadyExists(certificateId);
        if (expiresAt > 0 && expiresAt <= block.timestamp) revert InvalidExpirationDate();


        uint64 currentTime = uint64(block.timestamp);

        _certificates[certificateId] = Certificate({
            certificateId: certificateId,
            recipient: recipient,
            issuer: msg.sender,
            metadataURI: metadataURI,
            certificateHash: certificateHash,
            issuedAt: currentTime,
            expiresAt: expiresAt,
            revoked: false,
            revokedAt: 0,
            revocationReason: ""
        });

        _certificateExists[certificateId] = true;
        _allCertificateIds.push(certificateId);
        _issuerCertificates[msg.sender].push(certificateId);
        _recipientCertificates[recipient].push(certificateId);

        emit CertificateIssued(
            certificateId,
            recipient,
            msg.sender,
            certificateHash,
            metadataURI,
            currentTime,
            expiresAt
        );
    }

    // ==========================================
    // CERTIFICATE REVOCATION
    // ==========================================

    /**
     * @notice Revokes an issued certificate.
     * @dev Can ONLY be invoked by the original issuer or the platform administrator.
     * @param certificateId Identifier of the certificate to revoke.
     * @param reason Documented audit reason for revocation.
     */
    function revokeCertificate(
        string calldata certificateId,
        string calldata reason
    ) external override nonReentrant {
        if (!_certificateExists[certificateId]) revert CertificateDoesNotExist(certificateId);
        if (bytes(reason).length == 0 || bytes(reason).length > 512) revert InvalidRevocationReason();

        Certificate storage cert = _certificates[certificateId];

        if (cert.revoked) revert CertificateAlreadyRevoked(certificateId);

        // Security check: Only the issuing institution or the platform admin can revoke
        if (msg.sender != cert.issuer && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedRevocation(msg.sender);
        }

        uint64 currentTime = uint64(block.timestamp);
        cert.revoked = true;
        cert.revokedAt = currentTime;
        cert.revocationReason = reason;
        _revokedCertificatesCount++;

        emit CertificateRevoked(certificateId, msg.sender, currentTime, reason);
    }

    // ==========================================
    // VERIFICATION & RETRIEVAL
    // ==========================================

    /**
     * @notice Retrieves the full certificate struct by its ID.
     * @param certificateId Unique certificate identifier.
     */
    function getCertificate(
        string calldata certificateId
    ) external view override returns (Certificate memory) {
        if (!_certificateExists[certificateId]) revert CertificateDoesNotExist(certificateId);
        return _certificates[certificateId];
    }

    /**
     * @notice Public verification endpoint returning validity boolean and exact status enum.
     * @param certificateId Unique certificate identifier.
     * @return isValid True only if certificate exists, is not revoked, and is not expired.
     * @return status Detailed lifecycle status: NOT_FOUND, VERIFIED, REVOKED, or EXPIRED.
     */
    function isCertificateValid(
        string calldata certificateId
    ) external view override returns (bool isValid, Status status) {
        if (!_certificateExists[certificateId]) {
            return (false, Status.NOT_FOUND);
        }

        Certificate storage cert = _certificates[certificateId];

        if (cert.revoked) {
            return (false, Status.REVOKED);
        }

        if (cert.expiresAt > 0 && block.timestamp >= cert.expiresAt) {
            return (false, Status.EXPIRED);
        }

        return (true, Status.VERIFIED);
    }

    /**
     * @notice Checks whether a certificate ID exists on-chain.
     * @param certificateId Unique certificate identifier.
     */
    function certificateExists(
        string calldata certificateId
    ) external view override returns (bool) {
        return _certificateExists[certificateId];
    }

    /**
     * @notice Returns a human-readable status string for public displays.
     * @param certificateId Unique certificate identifier.
     */
    function getCertificateStatusString(
        string calldata certificateId
    ) external view override returns (string memory) {
        if (!_certificateExists[certificateId]) {
            return "NOT_FOUND";
        }

        Certificate storage cert = _certificates[certificateId];

        if (cert.revoked) {
            return "REVOKED";
        }

        if (cert.expiresAt > 0 && block.timestamp >= cert.expiresAt) {
            return "EXPIRED";
        }


        return "VERIFIED";
    }

    // ==========================================
    // ENUMERATION & DASHBOARDS
    // ==========================================

    /**
     * @notice Total number of registered certificates on the platform.
     */
    function totalCertificates() external view override returns (uint256) {
        return _allCertificateIds.length;
    }

    /**
     * @notice Returns all certificate IDs ever registered.
     */
    function getAllCertificateIds() external view override returns (string[] memory) {
        return _allCertificateIds;
    }

    /**
     * @notice Returns all certificate IDs issued by a specific institution.
     * @param issuer The address of the issuing institution.
     */
    function getCertificatesByIssuer(
        address issuer
    ) external view override returns (string[] memory) {
        return _issuerCertificates[issuer];
    }

    /**
     * @notice Returns all certificate IDs assigned to a specific recipient.
     * @param recipient The student/holder wallet address.
     */
    function getCertificatesByRecipient(
        address recipient
    ) external view override returns (string[] memory) {
        return _recipientCertificates[recipient];
    }

    /**
     * @notice Returns aggregated platform metrics in a single RPC call.
     */
    function getPlatformStats() external view override returns (PlatformStats memory) {
        uint256 total = _allCertificateIds.length;
        uint256 active = total >= _revokedCertificatesCount ? total - _revokedCertificatesCount : 0;

        return PlatformStats({
            totalCertificates: total,
            totalIssuers: _allIssuers.length,
            activeCertificates: active,
            revokedCertificates: _revokedCertificatesCount
        });
    }
}
