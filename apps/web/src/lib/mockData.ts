import { CertificateMetadata, OnChainCertificate, StatusType } from '@chaincert/shared';

export interface FullCertificateRecord {
  metadata: CertificateMetadata;
  onChain: OnChainCertificate;
  status: StatusType;
  txHash: `0x${string}`;
}

export const DEMO_CERTIFICATES: Record<string, FullCertificateRecord> = {
  'CC-2026-000001': {
    status: 'VERIFIED',
    txHash: '0x3a4f8d2e1b7c9e0a5d4f3e2b1a0c9e8d7f6b5a4c3e2d1f0a9b8c7e6d5f4a3b2c',
    onChain: {
      certificateId: 'CC-2026-000001',
      recipient: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      issuer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      metadataURI: 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
      certificateHash: '0x8f7d9b2e4c1a5f6e3d2b1a0c9e8d7f6b5a4c3e2d1f0a9b8c7e6d5f4a3b2c1e0f',
      issuedAt: 1773568800n, // March 2026
      expiresAt: 0n, // Lifetime
      revoked: false,
      revokedAt: 0n,
      revocationReason: '',
    },
    metadata: {
      certificateId: 'CC-2026-000001',
      recipient: {
        name: 'Alex Mercer',
        wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        email: 'alex.mercer@blockchain.edu',
      },
      course: 'Advanced Blockchain Engineering & Architecture',
      title: 'Certified Blockchain Architect (Distinction)',
      grade: 'Distinction (98/100)',
      institution: 'Global Web3 Institute',
      issuerWallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      issuedAt: 1773568800,
      expiresAt: 0,
      description: 'Successfully demonstrated mastery in Solidity smart contract security, EVM mechanics, cryptographic verification architectures, and full-stack Web3 application engineering.',
    },
  },
  'CC-2026-000002': {
    status: 'REVOKED',
    txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    onChain: {
      certificateId: 'CC-2026-000002',
      recipient: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      issuer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      metadataURI: 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      certificateHash: '0x4c3e2d1f0a9b8c7e6d5f4a3b2c1e0f8f7d9b2e4c1a5f6e3d2b1a0c9e8d7f6b5a',
      issuedAt: 1772000000n,
      expiresAt: 0n,
      revoked: true,
      revokedAt: 1772500000n,
      revocationReason: 'Revoked by authorized issuer: Administrative re-examination required due to grade reporting discrepancy.',
    },
    metadata: {
      certificateId: 'CC-2026-000002',
      recipient: {
        name: 'Jordan Vance',
        wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        email: 'jordan.vance@example.org',
      },
      course: 'Smart Contract Audit & Formal Verification',
      title: 'Associate Smart Contract Security Auditor',
      grade: 'Merit (82/100)',
      institution: 'Global Web3 Institute',
      issuerWallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      issuedAt: 1772000000,
      expiresAt: 0,
      description: 'Completed coursework in reentrancy mitigation, access-control patterns, and static analysis.',
    },
  },
  'CC-2026-000003': {
    status: 'EXPIRED',
    txHash: '0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
    onChain: {
      certificateId: 'CC-2026-000003',
      recipient: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      issuer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      metadataURI: 'ipfs://QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
      certificateHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      issuedAt: 1704067200n, // Jan 2024
      expiresAt: 1735689600n, // Jan 2025 (Expired)
      revoked: false,
      revokedAt: 0n,
      revocationReason: '',
    },
    metadata: {
      certificateId: 'CC-2026-000003',
      recipient: {
        name: 'Elena Rostova',
        wallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        email: 'elena.rostova@tech.edu',
      },
      course: 'DeFi Protocol Risk Management',
      title: 'Certified DeFi Risk Analyst (Annual)',
      grade: 'Pass (78/100)',
      institution: 'Global Web3 Institute',
      issuerWallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      issuedAt: 1704067200,
      expiresAt: 1735689600,
      description: 'Demonstrated proficiency in liquidity risk analysis, automated market maker security, and flash loan threat modeling.',
    },
  },
};

export const DEMO_ISSUERS = [
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`,
    name: 'Global Web3 Institute',
    authorizedAt: 1770000000,
    isAuthorized: true,
    totalIssued: 142,
    totalRevoked: 3,
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as `0x${string}`,
    name: 'MIT Decentralized Academy',
    authorizedAt: 1771000000,
    isAuthorized: true,
    totalIssued: 89,
    totalRevoked: 1,
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' as `0x${string}`,
    name: 'Stanford Blockchain Research Center',
    authorizedAt: 1772000000,
    isAuthorized: false,
    totalIssued: 45,
    totalRevoked: 0,
  },
];
