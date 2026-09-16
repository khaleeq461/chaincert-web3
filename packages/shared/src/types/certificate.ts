export type CertificateStatus = 'VERIFIED' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND' | 'PENDING';
export type StatusType = CertificateStatus;

export interface RecipientInfo {
  name: string;
  wallet: string;
  email?: string;
}

export interface CertificateMetadata {
  certificateId: string;
  recipient: RecipientInfo;
  course: string;
  title: string;
  grade?: string;
  institution: string;
  issuerWallet: string;
  issuedAt: number; // Unix timestamp in seconds
  expiresAt: number; // 0 = never expires
  description: string;
  attributes?: Record<string, string | number>;
  documentUrl?: string;
}

export interface OnChainCertificate {
  certificateId: string;
  recipient: `0x${string}`;
  issuer: `0x${string}`;
  metadataURI: string;
  certificateHash: `0x${string}`;
  issuedAt: bigint;
  expiresAt: bigint;
  revoked: boolean;
  revokedAt: bigint;
  revocationReason: string;
}

export interface VerificationResult {
  status: CertificateStatus;
  isValid: boolean;
  certificateId: string;
  onChainData?: OnChainCertificate;
  metadata?: CertificateMetadata;
  hashMatched?: boolean;
  computedHash?: string;
  statusMessage: string;
  verifiedAt: number;
}
