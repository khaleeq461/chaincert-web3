'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import {
  GraduationCap,
  Award,
  ShieldCheck,
  Share2,
  ExternalLink,
  Wallet,
  Check,
  Loader2,
  AlertOctagon,
  Clock,
  RefreshCw,
  Search,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CertificateCard } from '@/components/certificate/CertificateCard';
import {
  fetchCertificatesByRecipient,
  fetchCertificate,
  fetchCertificateValidity,
  fetchInstitutionName,
  OnChainCertData
} from '@/lib/contract';
import { downloadCertificatePdf } from '@/lib/pdf';
import { formatAddress, formatDate } from '@chaincert/shared';
import type { Address } from 'viem';
import { StatusType } from '@/components/ui/StatusBadge';

interface StudentCertificateItem {
  id: string;
  title: string;
  program: string;
  recipientName: string;
  institution: string;
  issueDate: number;
  expiresAt: number;
  status: StatusType;
  grade?: string;
  onChain: OnChainCertData;
}

export default function StudentDashboard() {
  const { address, isConnected } = useAccount();
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address to inspect: connected wallet, or fallback student address for demo
  const [targetAddress, setTargetAddress] = useState<string>('');

  useEffect(() => {
    if (address) {
      setTargetAddress(address);
    } else {
      // Default sample student account from Hardhat node (Account #2)
      setTargetAddress('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
    }
  }, [address]);

  const [certificates, setCertificates] = useState<StudentCertificateItem[]>([]);

  const loadStudentCredentials = useCallback(async () => {
    if (!targetAddress || !targetAddress.startsWith('0x')) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Query smart contract for certificate IDs owned by this recipient
      const certIds = await fetchCertificatesByRecipient(targetAddress as Address);

      if (certIds && certIds.length > 0) {
        const loaded = await Promise.all(
          certIds.map(async (id) => {
            const [onChain, validity] = await Promise.all([
              fetchCertificate(id),
              fetchCertificateValidity(id),
            ]);

            if (!onChain) return null;

            // Fetch institution name from contract
            let instName = 'Authorized Web3 Institution';
            if (onChain.issuer) {
              const name = await fetchInstitutionName(onChain.issuer);
              if (name) instName = name;
            }

            // Fetch off-chain IPFS metadata if available
            let title = 'Certified Web3 Engineer';
            let program = 'Blockchain Architecture & Smart Contracts';
            let recipientName = 'Verified Student';
            let grade: string | undefined;

            if (onChain.metadataURI) {
              try {
                const cid = onChain.metadataURI.replace(/^ipfs:\/\//, '');
                const res = await fetch(`/api/ipfs/${cid}`);
                if (res.ok) {
                  const meta = await res.json();
                  if (meta.credential?.title) title = meta.credential.title;
                  if (meta.credential?.course) program = meta.credential.course;
                  if (meta.recipient?.name) recipientName = meta.recipient.name;
                  if (meta.credential?.grade) grade = meta.credential.grade;
                }
              } catch {
                // Fallback to defaults
              }
            }

            const statusMap: Record<number, StatusType> = {
              0: 'NOT_FOUND',
              1: 'VERIFIED',
              2: 'REVOKED',
              3: 'EXPIRED',
            };

            const computedStatus = statusMap[validity.status] || (onChain.revoked ? 'REVOKED' : 'VERIFIED');

            return {
              id: onChain.certificateId,
              title,
              program,
              recipientName,
              institution: instName,
              issueDate: Number(onChain.issuedAt),
              expiresAt: Number(onChain.expiresAt),
              status: computedStatus,
              grade,
              onChain,
            };
          })
        );

        setCertificates(loaded.filter(Boolean) as StudentCertificateItem[]);
      } else {
        setCertificates([]);
      }
    } catch (err) {
      console.error('Failed to load recipient credentials from blockchain:', err);
      setError('Unable to load credentials from the blockchain registry.');
    } finally {
      setIsLoading(false);
    }
  }, [targetAddress]);

  useEffect(() => {
    loadStudentCredentials();
  }, [loadStudentCredentials]);

  // Metrics
  const totalCount = certificates.length;
  const activeCount = certificates.filter((c) => c.status === 'VERIFIED').length;
  const revokedCount = certificates.filter((c) => c.status === 'REVOKED').length;
  const expiredCount = certificates.filter((c) => c.status === 'EXPIRED').length;

  const handleCopyProfileLink = () => {
    if (typeof window !== 'undefined' && targetAddress) {
      const url = `${window.location.origin}/profile/${targetAddress}`;
      navigator.clipboard.writeText(url);
      setCopiedProfile(true);
      setTimeout(() => setCopiedProfile(false), 2000);
    }
  };

  const handleDownloadCertificate = async (id: string) => {
    const cert = certificates.find((c) => c.id === id);
    if (!cert) return;

    await downloadCertificatePdf({
      certificateId: cert.id,
      recipientName: cert.recipientName,
      recipientWallet: cert.onChain.recipient,
      certificateTitle: cert.title,
      course: cert.program,
      institutionName: cert.institution,
      issuerAddress: cert.onChain.issuer,
      issueDate: formatDate(cert.issueDate),
      expiryDate: cert.expiresAt > 0 ? formatDate(cert.expiresAt) : undefined,
      grade: cert.grade,
      verificationUrl: typeof window !== 'undefined' ? `${window.location.origin}/verify/${id}` : '',
      certificateHash: cert.onChain.certificateHash,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-400 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Student Credential Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            My Verified Credentials
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-mono flex items-center gap-1.5">
            Recipient Wallet: <span className="text-gray-200 font-semibold">{formatAddress(targetAddress, 6)}</span>
            {isConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">
                <ShieldCheck className="w-3 h-3" /> Connected
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStudentCredentials}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          <Button variant="outline" size="sm" onClick={handleCopyProfileLink}>
            {copiedProfile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedProfile ? 'Profile Copied' : 'Share Public Profile'}
          </Button>

          <Link href={`/profile/${targetAddress}`}>
            <Button size="sm">
              View Public Profile
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {!isConnected && (
        <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-4 h-4 text-brand-400 shrink-0" />
            <span>
              Connect your student wallet with MetaMask to automatically view certificates issued to your address. Viewing sample student profile (<code className="font-mono text-white">{formatAddress(targetAddress, 4)}</code>).
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={loadStudentCredentials}>
            Retry
          </Button>
        </div>
      )}

      {/* 4 Metric Cards as Requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Total Credentials
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{totalCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Bound to this wallet</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Active Credentials
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Verified on blockchain</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Revoked Credentials
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{revokedCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">With on-chain audit reason</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Expired Credentials
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{expiredCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Validity period elapsed</p>
        </Card>
      </div>

      {/* Certificate Cards Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Credentials in Vault</h3>
          {isLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
              Fetching blockchain state...
            </span>
          )}
        </div>

        {isLoading && certificates.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-400" />
            Retrieving credentials from Ethereum smart contract...
          </div>
        ) : certificates.length === 0 ? (
          <Card className="p-12 text-center">
            <GraduationCap className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">No Credentials Found</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
              No blockchain certificates are currently registered for address{' '}
              <code className="text-brand-300 font-mono">{formatAddress(targetAddress, 6)}</code>.
            </p>
            <Link href="/verify">
              <Button size="sm">Search Verification Registry</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((c) => (
              <CertificateCard
                key={c.id}
                id={c.id}
                title={c.title}
                program={c.program}
                recipientName={c.recipientName}
                institution={c.institution}
                issueDate={c.issueDate}
                status={c.status}
                grade={c.grade}
                onDownload={handleDownloadCertificate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
