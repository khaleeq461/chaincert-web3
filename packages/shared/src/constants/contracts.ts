export const CHAINCERT_ABI = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function ISSUER_ROLE() view returns (bytes32)",
  "function authorizeIssuer(address issuer, string institutionName)",
  "function deactivateIssuer(address issuer)",
  "function isIssuerAuthorized(address issuer) view returns (bool)",
  "function getInstitutionName(address issuer) view returns (string)",
  "function getAllIssuers() view returns (address[])",
  "function totalIssuers() view returns (uint256)",
  "function issueCertificate(string certificateId, address recipient, string metadataURI, bytes32 certificateHash, uint64 expiresAt)",
  "function revokeCertificate(string certificateId, string reason)",
  "function getCertificate(string certificateId) view returns (tuple(string certificateId, address recipient, address issuer, string metadataURI, bytes32 certificateHash, uint64 issuedAt, uint64 expiresAt, bool revoked, uint64 revokedAt, string revocationReason))",
  "function isCertificateValid(string certificateId) view returns (bool isValid, uint8 status)",
  "function certificateExists(string certificateId) view returns (bool)",
  "function getCertificateStatusString(string certificateId) view returns (string)",
  "function totalCertificates() view returns (uint256)",
  "function getAllCertificateIds() view returns (string[])",
  "function getCertificatesByIssuer(address issuer) view returns (string[])",
  "function getCertificatesByRecipient(address recipient) view returns (string[])",
  "function getPlatformStats() view returns (tuple(uint256 totalCertificates, uint256 totalIssuers, uint256 activeCertificates, uint256 revokedCertificates))",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "event CertificateIssued(string indexed certificateId, address indexed recipient, address indexed issuer, bytes32 certificateHash, string metadataURI, uint64 issuedAt, uint64 expiresAt)",
  "event CertificateRevoked(string indexed certificateId, address indexed issuer, uint64 revokedAt, string reason)",
  "event IssuerAuthorized(address indexed issuer, string institutionName, uint64 authorizedAt)",
  "event IssuerRevoked(address indexed issuer, uint64 revokedAt)"
] as const;

export const DEFAULT_CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  11155111: "0x9B4D250C5F475dD7f28B57CE79495449f1bDb959",
};
