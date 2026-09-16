'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  User,
  Share2,
  Check,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Copy,
  AlertOctagon,
  Clock,
  Award,
  AlertCircle,
  Database
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CertificateCard } from '@/components/certificate/CertificateCard';
import {
  fetchCertificatesByRecipient,
  fetchCertificate,
  fetchCertificateValidity,
  fetchInstitutionName,
  CHAINCERT_CONTRACT_ADDRESS,
  OnChainCertData
} from '@/lib/contract';
import { downloadCertificatePdf } from '@/lib/pdf';
import { formatAddress, formatDate } from '@chaincert/shared';
import { isAddress, type Address } from 'viem';
import { StatusType } from '@/components/ui/StatusBadge';

interface ProfileCertificateItem {
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

export default function PublicStudentProfilePage() {
  const params = useParams();
  const rawAddress = Array.isArray(params?.address) ? params.address[0] : (params?.address as string) || '';

  const [copied, setCopied] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<ProfileCertificateItem[]>([]);

  const isValidWallet = isAddress(rawAddress);

  useEffect(() => {
    async function loadPublicPortfolio() {
      if (!isValidWallet) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const certIds = await fetchCertificatesByRecipient(rawAddress as Address);

        if (certIds && certIds.length > 0) {
          const loaded = await Promise.all(
            certIds.map(async (id) => {
              const [onChain, validity] = await Promise.all([
                fetchCertificate(id),
                fetchCertificateValidity(id),
              ]);

              if (!onChain) return null;

              // Fetch on-chain institution name
              let instName = 'Authorized Web3 Institution';
              if (onChain.issuer) {
                const name = await fetchInstitutionName(onChain.issuer);
                if (name) instName = name;
              }

              // Fetch off-chain metadata from IPFS if present
              let title = 'Blockchain Credential';
              let program = 'Decentralized Engineering';
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
                  // Keep defaults
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

          setCertificates(loaded.filter(Boolean) as ProfileCertificateItem[]);
        } else {
          setCertificates([]);
        }
      } catch (err) {
        console.error('Failed to load public profile from blockchain:', err);
        setError('Error retrieving certificates from the Ethereum blockchain.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicPortfolio();
  }, [rawAddress, isValidWallet]);

  const activeCount = certificates.filter((c) => c.status === 'VERIFIED').length;
  const revokedCount = certificates.filter((c) => c.status === 'REVOKED').length;
  const expiredCount = certificates.filter((c) => c.status === 'EXPIRED').length;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(rawAddress);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
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

  // Invalid address check
  if (!isValidWallet) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-white mb-2">Invalid Wallet Address</h1>
        <p className="text-xs text-gray-400 mb-6">
          The requested profile path is not a valid 42-character Ethereum address (0x...).
        </p>
        <Link href="/verify">
          <Button size="sm">Search Verification Registry</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/verify"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Verification Portal
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-card-border text-[11px] text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Public On-Chain Registry</span>
        </div>
      </div>

      {/* Profile Header Banner */}
      <Card className="p-8 mb-8 border-card-border bg-card/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-brand-500/20 shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Student Credential Portfolio
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  EVM Verified
                </span>
              </div>

              <div className="font-mono text-xs text-gray-400 flex items-center gap-2">
                <span>Wallet:</span>
                <span className="text-white font-medium break-all">{rawAddress}</span>
                <button
                  onClick={handleCopyWallet}
                  className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                  title="Copy Wallet Address"
                >
                  {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Profile Copied' : 'Share Profile'}
            </Button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="mt-6 pt-6 border-t border-card-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-400 block mb-0.5">Total Credentials</span>
            <span className="text-lg font-bold text-white font-mono">{certificates.length}</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Active & Valid</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{activeCount}</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Revoked</span>
            <span className="text-lg font-bold text-rose-400 font-mono">{revokedCount}</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Expired</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{expiredCount}</span>
          </div>
        </div>
      </Card>

      {/* Public Credentials Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Verified Academic Credentials</h2>
            <p className="text-xs text-gray-400">
              Only authentic smart contract credentials issued to this wallet are displayed.
            </p>
          </div>
          {isLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
              Syncing blockchain...
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-400" />
            Querying student credentials from ChainCert smart contract...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        ) : certificates.length === 0 ? (
          <Card className="p-12 text-center">
            <GraduationCap className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Public Credentials Found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
              There are currently no academic credentials registered for address{' '}
              <code className="text-brand-300 font-mono">{formatAddress(rawAddress, 6)}</code> on the Ethereum registry.
            </p>
            <Link href="/verify">
              <Button size="sm">Search Registry by Certificate ID</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <CertificateCard
                key={cert.id}
                id={cert.id}
                title={cert.title}
                program={cert.program}
                recipientName={cert.recipientName}
                institution={cert.institution}
                issueDate={cert.issueDate}
                status={cert.status}
                grade={cert.grade}
                onDownload={handleDownloadCertificate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
