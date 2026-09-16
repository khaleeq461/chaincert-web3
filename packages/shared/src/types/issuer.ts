export interface IssuerProfile {
  address: `0x${string}`;
  name: string;
  website?: string;
  isAuthorized: boolean;
  authorizedAt: number;
  totalIssued: number;
  totalRevoked: number;
}

export interface PlatformStats {
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  totalIssuers: number;
}
