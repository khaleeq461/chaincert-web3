import { parseAbi, type Address } from 'viem';
import { publicClient } from './viem';

export const CHAINCERT_CONTRACT_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address) ||
  '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const DEFAULT_ADMIN_ROLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

export const ISSUER_ROLE =
  '0x1534062bf65d4b58e658399589d97bf27cb224aa76356c9d7be1dbd15eb1d203' as `0x${string}`;

export const CHAINCERT_ABI = parseAbi([
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function ISSUER_ROLE() view returns (bytes32)',
  'function authorizeIssuer(address issuer, string institutionName)',
  'function deactivateIssuer(address issuer)',
  'function isIssuerAuthorized(address issuer) view returns (bool)',
  'function getInstitutionName(address issuer) view returns (string)',
  'function getAllIssuers() view returns (address[])',
  'function totalIssuers() view returns (uint256)',
  'function issueCertificate(string certificateId, address recipient, string metadataURI, bytes32 certificateHash, uint64 expiresAt)',
  'function revokeCertificate(string certificateId, string reason)',
  'function getCertificate(string certificateId) view returns ((string certificateId, address recipient, address issuer, string metadataURI, bytes32 certificateHash, uint64 issuedAt, uint64 expiresAt, bool revoked, uint64 revokedAt, string revocationReason))',
  'function isCertificateValid(string certificateId) view returns (bool isValid, uint8 status)',
  'function certificateExists(string certificateId) view returns (bool)',
  'function getCertificateStatusString(string certificateId) view returns (string)',
  'function totalCertificates() view returns (uint256)',
  'function getAllCertificateIds() view returns (string[])',
  'function getCertificatesByIssuer(address issuer) view returns (string[])',
  'function getCertificatesByRecipient(address recipient) view returns (string[])',
  'function getPlatformStats() view returns ((uint256 totalCertificates, uint256 totalIssuers, uint256 activeCertificates, uint256 revokedCertificates))',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'event CertificateIssued(string indexed certificateId, address indexed recipient, address indexed issuer, bytes32 certificateHash, string metadataURI, uint64 issuedAt, uint64 expiresAt)',
  'event CertificateRevoked(string indexed certificateId, address indexed issuer, uint64 revokedAt, string reason)',
  'event IssuerAuthorized(address indexed issuer, string institutionName, uint64 authorizedAt)',
  'event IssuerRevoked(address indexed issuer, uint64 revokedAt)',
]);

export interface OnChainCertData {
  certificateId: string;
  recipient: Address;
  issuer: Address;
  metadataURI: string;
  certificateHash: `0x${string}`;
  issuedAt: bigint;
  expiresAt: bigint;
  revoked: boolean;
  revokedAt: bigint;
  revocationReason: string;
}

/**
 * Reads a single certificate record from the deployed smart contract
 */
export async function fetchCertificate(certificateId: string): Promise<OnChainCertData | null> {
  try {
    const data = await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'getCertificate',
      args: [certificateId],
    });
    return data as OnChainCertData;
  } catch (err) {
    return null;
  }
}

/**
 * Queries validity status for public verification
 */
export async function fetchCertificateValidity(certificateId: string): Promise<{ isValid: boolean; status: number }> {
  try {
    const [isValid, status] = await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'isCertificateValid',
      args: [certificateId],
    });
    return { isValid, status: Number(status) };
  } catch (err) {
    return { isValid: false, status: 0 };
  }
}

/**
 * Checks if an address has admin permissions
 */
export async function checkIsAdmin(account: Address): Promise<boolean> {
  try {
    return (await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'hasRole',
      args: [DEFAULT_ADMIN_ROLE, account],
    })) as boolean;
  } catch {
    return false;
  }
}

/**
 * Checks if an address has issuer permissions
 */
export async function checkIsIssuer(account: Address): Promise<boolean> {
  try {
    return (await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'isIssuerAuthorized',
      args: [account],
    })) as boolean;
  } catch {
    return false;
  }
}


/**
 * Retrieves platform statistics in a single call
 */
export async function fetchPlatformStats(): Promise<{
  totalCertificates: number;
  totalIssuers: number;
  activeCertificates: number;
  revokedCertificates: number;
}> {
  try {
    const stats = await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'getPlatformStats',
    });
    return {
      totalCertificates: Number(stats.totalCertificates),
      totalIssuers: Number(stats.totalIssuers),
      activeCertificates: Number(stats.activeCertificates),
      revokedCertificates: Number(stats.revokedCertificates),
    };
  } catch (err) {
    return {
      totalCertificates: 0,
      totalIssuers: 0,
      activeCertificates: 0,
      revokedCertificates: 0,
    };
  }
}

/**
 * Retrieves all authorized issuer addresses
 */
export async function fetchAllIssuers(): Promise<Address[]> {
  try {
    const issuers = await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'getAllIssuers',
    });
    return issuers as Address[];
  } catch {
    return [];
  }
}

/**
 * Retrieves institution name for an issuer
 */
export async function fetchInstitutionName(issuer: Address): Promise<string> {
  try {
    const name = await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'getInstitutionName',
      args: [issuer],
    });
    return name as string;
  } catch {
    return '';
  }
}

/**
 * Retrieves certificate IDs issued by a specific issuer
 */
export async function fetchCertificatesByIssuer(issuer: Address): Promise<string[]> {
  try {
    const ids = await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'getCertificatesByIssuer',
      args: [issuer],
    });
    return ids as string[];
  } catch {
    return [];
  }
}

/**
 * Retrieves certificate IDs owned by a recipient
 */
export async function fetchCertificatesByRecipient(recipient: Address): Promise<string[]> {
  try {
    const ids = await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'getCertificatesByRecipient',
      args: [recipient],
    });
    return ids as string[];
  } catch {
    return [];
  }
}

/**
 * Retrieves all certificate IDs ever registered on-chain
 */
export async function fetchAllCertificateIds(): Promise<string[]> {
  try {
    const ids = await publicClient.readContract({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'getAllCertificateIds',
    });
    return ids as string[];
  } catch {
    return [];
  }
}

