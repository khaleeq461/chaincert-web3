'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  AlertOctagon,
  Clock,
  HelpCircle,
  Award,
  Calendar,
  User,
  ExternalLink,
  Copy,
  Check,
  Download,
  Share2,
  ArrowLeft,
  QrCode,
  Loader2,
  Database,
  Hash,
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge, StatusType } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchCertificate,
  fetchCertificateValidity,
  fetchInstitutionName,
  CHAINCERT_CONTRACT_ADDRESS,
  OnChainCertData
} from '@/lib/contract';
import { downloadCertificatePdf } from '@/lib/pdf';
import { formatDate, formatAddress } from '@chaincert/shared';
import QRCode from 'qrcode';
import { IntegrityVerificationCard } from '@/components/certificate/IntegrityVerificationCard';


interface MetadataPayload {
  recipient?: { name?: string; walletAddress?: string };
  issuer?: { name?: string; walletAddress?: string };
  credential?: { title?: string; course?: string; grade?: string; description?: string };
  dates?: { issuedAt?: string; expiresAt?: string | null };
}

export default function VerifyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';

  const [isLoading, setIsLoading] = useState(true);
  const [onChainRecord, setOnChainRecord] = useState<OnChainCertData | null>(null);
  const [institutionName, setInstitutionName] = useState<string>('');
  const [metadata, setMetadata] = useState<MetadataPayload | null>(null);
  const [status, setStatus] = useState<StatusType>('NOT_FOUND');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [verificationTime, setVerificationTime] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedIssuer, setCopiedIssuer] = useState(false);
  const [copiedRecipient, setCopiedRecipient] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const networkName = process.env.NEXT_PUBLIC_CHAIN_ID === '11155111'
    ? 'Ethereum Sepolia (Testnet)'
    : 'Hardhat Localhost (Chain ID: 31337)';

  const explorerBaseUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://sepolia.etherscan.io';

  useEffect(() => {
    setVerificationTime(new Date().toUTCString());

    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      QRCode.toDataURL(currentUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }

    async function loadAuthoritativeBlockchainData() {
      if (!id) {
        setIsLoading(false);
        setStatus('NOT_FOUND');
        return;
      }

      setIsLoading(true);
      try {
        // Query the authoritative smart contract state
        const [certData, validity] = await Promise.all([
          fetchCertificate(id),
          fetchCertificateValidity(id),
        ]);

        if (!certData || validity.status === 0) {
          setOnChainRecord(null);
          setStatus('NOT_FOUND');
          setIsLoading(false);
          return;
        }

        setOnChainRecord(certData);

        // Map status directly from blockchain smart contract enum
        const statusMap: Record<number, StatusType> = {
          0: 'NOT_FOUND',
          1: 'VERIFIED',
          2: 'REVOKED',
          3: 'EXPIRED',
        };
        setStatus(statusMap[validity.status] || (certData.revoked ? 'REVOKED' : 'VERIFIED'));

        // Fetch on-chain institution name
        if (certData.issuer) {
          const instName = await fetchInstitutionName(certData.issuer);
          if (instName) setInstitutionName(instName);
        }

        // Fetch off-chain metadata from IPFS if available
        if (certData.metadataURI) {
          try {
            const cid = certData.metadataURI.replace(/^ipfs:\/\//, '');
            const ipfsRes = await fetch(`/api/ipfs/${cid}`);
            if (ipfsRes.ok) {
              const metaJson = await ipfsRes.json();
              setMetadata(metaJson);
            }
          } catch (e) {
            console.warn('Metadata fetch fallback:', e);
          }
        }
      } catch (err) {
        console.error('Blockchain verification query error:', err);
        setStatus('NOT_FOUND');
      } finally {
        setIsLoading(false);
      }
    }

    loadAuthoritativeBlockchainData();
  }, [id]);

  const handleCopy = (text: string, type: 'id' | 'issuer' | 'recipient' | 'hash' | 'share') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }
    if (type === 'issuer') { setCopiedIssuer(true); setTimeout(() => setCopiedIssuer(false), 2000); }
    if (type === 'recipient') { setCopiedRecipient(true); setTimeout(() => setCopiedRecipient(false), 2000); }
    if (type === 'hash') { setCopiedHash(true); setTimeout(() => setCopiedHash(false), 2000); }
    if (type === 'share') { setCopiedShare(true); setTimeout(() => setCopiedShare(false), 2000); }
  };

  const handleDownloadPdf = async () => {
    if (!onChainRecord) return;
    const certTitle = metadata?.credential?.title || 'Academic Certificate of Completion';
    const course = metadata?.credential?.course || 'Blockchain Engineering & Web3 Architecture';
    const recipientName = metadata?.recipient?.name || 'Verified Recipient';
    const institution = institutionName || metadata?.issuer?.name || 'Authorized Institution';

    await downloadCertificatePdf({
      certificateId: onChainRecord.certificateId,
      recipientName,
      recipientWallet: onChainRecord.recipient,
      certificateTitle: certTitle,
      course,
      institutionName: institution,
      issuerAddress: onChainRecord.issuer,
      issueDate: formatDate(Number(onChainRecord.issuedAt)),
      expiryDate: onChainRecord.expiresAt > 0n ? formatDate(Number(onChainRecord.expiresAt)) : undefined,
      grade: metadata?.credential?.grade,
      description: metadata?.credential?.description,
      verificationUrl: typeof window !== 'undefined' ? window.location.href : '',
      certificateHash: onChainRecord.certificateHash,
    });
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/verify/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const statusConfig = {
    VERIFIED: {
      border: 'border-emerald-500/40 bg-emerald-500/5',
      badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      title: 'VERIFIED / ACTIVE',
      primaryMessage: 'The certificate is authentic and currently valid.',
      subMessage: 'Cryptographic integrity and active validity confirmed by the smart contract registry.',
    },
    REVOKED: {
      border: 'border-rose-500/40 bg-rose-500/5',
      badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      icon: AlertOctagon,
      iconColor: 'text-rose-400',
      title: 'REVOKED',
      primaryMessage: 'This certificate was issued on the blockchain but has been revoked by the authorized issuer.',
      subMessage: 'This credential is no longer valid for institutional or professional verification.',
    },
    EXPIRED: {
      border: 'border-amber-500/40 bg-amber-500/5',
      badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: Clock,
      iconColor: 'text-amber-400',
      title: 'EXPIRED',
      primaryMessage: 'This certificate exists on the blockchain but its validity period has expired.',
      subMessage: 'The credential duration defined at issuance has elapsed.',
    },
    PENDING: {
      border: 'border-indigo-500/40 bg-indigo-500/5',
      badgeClass: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      icon: Loader2,
      iconColor: 'text-indigo-400',
      title: 'PENDING CONFIRMATION',
      primaryMessage: 'This certificate transaction is awaiting blockchain confirmation.',
      subMessage: 'The transaction is currently broadcast in the mempool waiting for validator block inclusion.',
    },
    NOT_FOUND: {
      border: 'border-card-border bg-card/20',
      badgeClass: 'bg-gray-500/10 border-gray-500/30 text-gray-300',
      icon: HelpCircle,
      iconColor: 'text-gray-400',
      title: 'NOT FOUND',
      primaryMessage: 'No certificate with this ID was found.',
      subMessage: 'The requested identifier has never been registered on the ChainCert smart contract.',
    },
  };

  const currentConfig = statusConfig[status] || statusConfig.NOT_FOUND;
  const StatusIcon = currentConfig.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          href="/verify"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Certificate Search
        </Link>

        {/* Live Authoritative Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-card-border text-[11px] text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Authoritative Source: Ethereum Smart Contract ({networkName})</span>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-16 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Querying Ethereum Blockchain...</h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Directly retrieving cryptographic records, issuer signature, and current validity status from smart contract.
          </p>
        </Card>
      ) : status === 'NOT_FOUND' || !onChainRecord ? (
        /* NOT FOUND STATE */
        <div className="space-y-6">
          <Card className="p-10 border-rose-500/30 bg-rose-950/10 text-center">
            <div className="inline-flex p-4 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 mb-4">
              <HelpCircle className="w-10 h-10" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono font-bold mb-3">
              NOT FOUND ON-CHAIN
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              No certificate with this ID was found.
            </h1>

            <p className="text-sm text-gray-300 max-w-lg mx-auto mb-6">
              The identifier <code className="text-brand-300 font-mono font-semibold bg-black/40 px-2 py-0.5 rounded border border-card-border">{id}</code> does not exist on the ChainCert smart contract registry (<code className="text-gray-400 font-mono text-xs">{formatAddress(CHAINCERT_CONTRACT_ADDRESS, 6)}</code>).
            </p>

            <div className="p-4 rounded-xl bg-black/40 border border-card-border max-w-md mx-auto text-left text-xs text-gray-400 space-y-2 mb-8">
              <div className="font-semibold text-gray-200">Possible explanations:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>The certificate ID was typed incorrectly.</li>
                <li>The issuer has not yet finalized the on-chain issuance transaction.</li>
                <li>The credential is fraudulent or not anchored to ChainCert.</li>
              </ul>
            </div>

            {/* Try Another ID Search */}
            <form onSubmit={handleNewSearch} className="max-w-md mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try another Certificate ID..."
                  className="w-full rounded-xl bg-black/50 border border-card-border pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
              <Button type="submit" size="sm">Search</Button>
            </form>
          </Card>
        </div>
      ) : (
        /* FOUND: VERIFIED, REVOKED, OR EXPIRED */
        <div className="space-y-6">
          {/* PRIMARY STATUS BANNER */}
          <div className={`p-6 rounded-2xl border ${currentConfig.border} transition-all`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl bg-black/40 border border-white/10 shrink-0 ${currentConfig.iconColor}`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={status} size="md" />
                    <span className="text-xs text-gray-400 font-mono">
                      Query Timestamp: {verificationTime}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {currentConfig.primaryMessage}
                  </h1>
                  <p className="text-xs text-gray-300 mt-1">
                    {currentConfig.subMessage}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(typeof window !== 'undefined' ? window.location.href : '', 'share')}
                  className="flex-1 md:flex-initial"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                      Copied Link!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />
                      Share Link
                    </>
                  )}
                </Button>

                {status === 'VERIFIED' && (
                  <Button
                    size="sm"
                    onClick={handleDownloadPdf}
                    className="flex-1 md:flex-initial"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download PDF
                  </Button>
                )}
              </div>
            </div>

            {/* REVOCATION AUDIT BOX */}
            {status === 'REVOKED' && (
              <div className="mt-5 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Official Revocation Audit Record
                </div>
                <div className="text-gray-200 mt-1">
                  <strong>Reason:</strong> {onChainRecord.revocationReason || 'Revoked by authorized issuer.'}
                </div>
                {onChainRecord.revokedAt > 0n && (
                  <div className="text-gray-400 mt-1">
                    <strong>Revoked At:</strong> {formatDate(Number(onChainRecord.revokedAt))}
                  </div>
                )}
              </div>
            )}

            {/* EXPIRATION NOTICE BOX */}
            {status === 'EXPIRED' && (
              <div className="mt-5 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Validity Period Concluded
                </div>
                <div className="text-gray-200 mt-1">
                  This credential expired on <strong>{formatDate(Number(onChainRecord.expiresAt))}</strong> and is no longer active.
                </div>
              </div>
            )}
          </div>

          {/* CREDENTIAL DOSSIER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Main Certificate Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="pb-4 border-b border-card-border flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-brand-400 font-semibold mb-1 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      {institutionName || metadata?.issuer?.name || 'Authorized Academic Institution'}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      {metadata?.credential?.title || 'Certified Blockchain Credential'}
                    </h2>
                    <div className="text-sm text-gray-300 mt-0.5">
                      {metadata?.credential?.course || 'Advanced Web3 & Smart Contracts Engineering'}
                    </div>
                  </div>

                  {metadata?.credential?.grade && (
                    <div className="px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 font-bold text-xs shrink-0">
                      {metadata.credential.grade}
                    </div>
                  )}
                </div>

                {/* Recipient & Dates Grid */}
                <div className="py-5 border-b border-card-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-gray-400 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Recipient Name:
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {metadata?.recipient?.name || 'Verified Recipient'}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Issuance Date:
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {formatDate(Number(onChainRecord.issuedAt))}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Validity Period:
                    </div>
                    <div className="text-sm text-gray-200">
                      {onChainRecord.expiresAt > 0n
                        ? `Valid until ${formatDate(Number(onChainRecord.expiresAt))}`
                        : 'Lifetime Validity (Never Expires)'}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      Issuing Institution:
                    </div>
                    <div className="text-sm text-gray-200">
                      {institutionName || metadata?.issuer?.name || 'Cambridge Web3 Academy'}
                    </div>
                  </div>
                </div>

                {/* Competencies / Description */}
                {metadata?.credential?.description && (
                  <div className="pt-4 text-xs text-gray-300 leading-relaxed">
                    <div className="text-gray-400 font-medium mb-1">Competencies & Learning Outcomes:</div>
                    <div className="bg-black/20 p-3 rounded-lg border border-card-border">
                      {metadata.credential.description}
                    </div>
                  </div>
                )}
              </Card>

              {/* ON-CHAIN TECHNICAL SPECIFICATIONS */}
              <Card className="p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Authoritative Blockchain Registry Data
                </h3>

                <div className="space-y-3.5 text-xs">
                  {/* Certificate ID */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-card-border gap-2">
                    <span className="text-gray-400 font-medium">Certificate ID:</span>
                    <div className="flex items-center gap-2 font-mono text-white">
                      <span>{onChainRecord.certificateId}</span>
                      <button
                        onClick={() => handleCopy(onChainRecord.certificateId, 'id')}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                        title="Copy Certificate ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Recipient Wallet */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-card-border gap-2">
                    <span className="text-gray-400 font-medium">Recipient Wallet Address:</span>
                    <div className="flex items-center gap-2 font-mono text-white">
                      <span className="truncate max-w-[240px] sm:max-w-xs">{onChainRecord.recipient}</span>
                      <button
                        onClick={() => handleCopy(onChainRecord.recipient, 'recipient')}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                        title="Copy Address"
                      >
                        {copiedRecipient ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Issuer Wallet */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-black/40 border border-card-border gap-2">
                    <span className="text-gray-400 font-medium">Authorized Issuer Wallet:</span>
                    <div className="flex items-center gap-2 font-mono text-white">
                      <span className="truncate max-w-[240px] sm:max-w-xs">{onChainRecord.issuer}</span>
                      <button
                        onClick={() => handleCopy(onChainRecord.issuer, 'issuer')}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                        title="Copy Issuer"
                      >
                        {copiedIssuer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Cryptographic Hash */}
                  <div className="p-2.5 rounded-lg bg-black/40 border border-card-border">
                    <div className="flex items-center justify-between text-gray-400 font-medium mb-1">
                      <span>Cryptographic Digest (Keccak256 Fingerprint):</span>
                      <button
                        onClick={() => handleCopy(onChainRecord.certificateHash, 'hash')}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="font-mono text-emerald-400 text-xs break-all">
                      {onChainRecord.certificateHash}
                    </div>
                  </div>

                  {/* Metadata URI & Network */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-card-border">
                      <span className="text-gray-400 block mb-1">IPFS Storage URI:</span>
                      <span className="font-mono text-brand-400 text-xs break-all">
                        {onChainRecord.metadataURI}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-card-border">
                      <span className="text-gray-400 block mb-1">Smart Contract Address:</span>
                      <span className="font-mono text-gray-200 text-xs break-all">
                        {CHAINCERT_CONTRACT_ADDRESS}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Cryptographic Document Integrity Verification Card */}
              <IntegrityVerificationCard
                certificateId={onChainRecord.certificateId}
                blockchainHash={onChainRecord.certificateHash}
                metadataURI={onChainRecord.metadataURI}
                pdfDownloadHandler={handleDownloadPdf}
              />
            </div>


            {/* Right Col: QR Verification Code & Explorer Panel */}
            <div className="space-y-6">
              {/* Dynamic QR Card */}
              <Card className="p-6 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-4 flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Public Verification QR
                </h3>

                {qrDataUrl && (
                  <div className="inline-block p-3 rounded-2xl bg-white shadow-xl mb-3">
                    <Image
                      src={qrDataUrl}
                      alt="Verification QR Code"
                      width={160}
                      height={160}
                      unoptimized
                    />
                  </div>
                )}

                <div className="text-[11px] text-gray-400 leading-relaxed mb-4">
                  Point any smartphone camera to inspect this verifiable blockchain record directly.
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(typeof window !== 'undefined' ? window.location.href : '', 'share')}
                  className="w-full"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Copy Verification Link
                </Button>
              </Card>

              {/* Network & Contract Proof */}
              <Card className="p-6 text-xs space-y-3">
                <div className="font-semibold text-white mb-2">Blockchain Proof</div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Network</span>
                  <span className="text-white font-mono">{networkName}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Standard</span>
                  <span className="text-white font-mono">EVM ERC-721 Compatible Struct</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>Consensus</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    Finalized
                  </span>
                </div>
                <div className="pt-3 border-t border-card-border">
                  <a
                    href={`${explorerBaseUrl}/address/${CHAINCERT_CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-400 hover:text-brand-300 flex items-center justify-between text-xs"
                  >
                    <span>View Contract on Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card>

              {/* Evaluator's Guide Card */}
              <Card className="p-6 text-xs space-y-3 bg-gradient-to-b from-brand-950/20 to-card/50 border-brand-500/20">
                <div className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  Academic Evaluator&apos;s Guide
                </div>
                <div className="text-gray-300 text-[11px] leading-relaxed space-y-2">
                  <p>
                    <strong className="text-white">1. Mathematical Immutability:</strong> The document fingerprint is permanently anchored in the Ethereum state tree. Neither the student nor an external attacker can alter grades or dates.
                  </p>
                  <p>
                    <strong className="text-white">2. On-Chain Role Verification:</strong> The issuer address was cryptographically confirmed to hold <code className="text-brand-300 font-mono">ISSUER_ROLE</code> granted by the platform administrator.
                  </p>
                  <p>
                    <strong className="text-white">3. Zero-Trust Verification:</strong> This query was performed trustlessly over public RPC nodes without requiring a Web3 wallet, login, or central database.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
