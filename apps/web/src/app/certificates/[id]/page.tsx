'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Calendar,
  User,
  ShieldCheck,
  FileDown,
  ArrowLeft,
  ExternalLink,
  QrCode,
  Share2,
  Check,
  AlertOctagon,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge, StatusType } from '@/components/ui/StatusBadge';
import {
  fetchCertificate,
  fetchCertificateValidity,
  fetchInstitutionName,
  OnChainCertData
} from '@/lib/contract';
import { downloadCertificatePdf } from '@/lib/pdf';
import { formatDate, formatAddress } from '@chaincert/shared';
import QRCode from 'qrcode';
import { IntegrityVerificationCard } from '@/components/certificate/IntegrityVerificationCard';


export default function CertificateDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';

  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onChain, setOnChain] = useState<OnChainCertData | null>(null);
  const [status, setStatus] = useState<StatusType>('NOT_FOUND');
  const [institutionName, setInstitutionName] = useState('Cambridge Web3 Academy');
  const [metadata, setMetadata] = useState<{
    recipientName: string;
    title: string;
    course: string;
    description: string;
    grade?: string;
  }>({
    recipientName: 'Verified Student',
    title: 'Certified Blockchain Architect',
    course: 'Advanced Web3 & Smart Contracts Engineering',
    description: 'Authentic academic credential anchored to the Ethereum blockchain.',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verifyUrl = `${window.location.origin}/verify/${id}`;
      QRCode.toDataURL(verifyUrl, { width: 140, margin: 1, color: { dark: '#111726', light: '#ffffff' } })
        .then((url) => setQrUrl(url))
        .catch(() => {});
    }

    async function loadCertificateRecord() {
      setIsLoading(true);
      try {
        const [certData, validity] = await Promise.all([
          fetchCertificate(id),
          fetchCertificateValidity(id),
        ]);

        if (certData) {
          setOnChain(certData);

          const statusMap: Record<number, StatusType> = {
            0: 'NOT_FOUND',
            1: 'VERIFIED',
            2: 'REVOKED',
            3: 'EXPIRED',
          };
          setStatus(statusMap[validity.status] || (certData.revoked ? 'REVOKED' : 'VERIFIED'));

          // Fetch on-chain institution
          if (certData.issuer) {
            const inst = await fetchInstitutionName(certData.issuer);
            if (inst) setInstitutionName(inst);
          }

          // Fetch off-chain IPFS metadata if present
          if (certData.metadataURI) {
            try {
              const cid = certData.metadataURI.replace(/^ipfs:\/\//, '');
              const metaRes = await fetch(`/api/ipfs/${cid}`);
              if (metaRes.ok) {
                const metaJson = await metaRes.json();
                setMetadata({
                  recipientName: metaJson.recipient?.name || 'Verified Student',
                  title: metaJson.credential?.title || 'Certified Blockchain Architect',
                  course: metaJson.credential?.course || 'Advanced Web3 & Smart Contracts Engineering',
                  description: metaJson.credential?.description || 'Authentic academic credential anchored to the Ethereum blockchain.',
                  grade: metaJson.credential?.grade,
                });
              }
            } catch {
              // Retain defaults
            }
          }
        } else {
          setStatus('NOT_FOUND');
        }
      } catch (err) {
        console.error('Failed to load certificate detail:', err);
        setStatus('NOT_FOUND');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadCertificateRecord();
    }
  }, [id]);

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/verify/${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!onChain) return;
    await downloadCertificatePdf({
      certificateId: onChain.certificateId,
      recipientName: metadata.recipientName,
      recipientWallet: onChain.recipient,
      certificateTitle: metadata.title,
      course: metadata.course,
      institutionName,
      issuerAddress: onChain.issuer,
      issueDate: formatDate(Number(onChain.issuedAt)),
      expiryDate: onChain.expiresAt > 0n ? formatDate(Number(onChain.expiresAt)) : undefined,
      grade: metadata.grade,
      description: metadata.description,
      verificationUrl: typeof window !== 'undefined' ? `${window.location.origin}/verify/${id}` : '',
      certificateHash: onChain.certificateHash,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-400" />
        <h2 className="text-xl font-bold text-white mb-1">Loading Certificate from Blockchain...</h2>
        <p className="text-xs text-gray-400 font-mono">Querying ID: {id}</p>
      </div>
    );
  }

  if (!onChain || status === 'NOT_FOUND') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Certificate Not Found</h2>
        <p className="text-xs text-gray-400 mb-6">No credential with ID {id} was found on the smart contract registry.</p>
        <Link href="/verify">
          <Button size="sm">Search Certificates</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link href="/student" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Credentials
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Link Copied' : 'Share'}
          </Button>

          <Button size="sm" onClick={handleDownload}>
            <FileDown className="w-3.5 h-3.5 mr-1" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* REVOKED ALERT BANNER */}
      {status === 'REVOKED' && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-300 text-sm">Certificate Revoked on Blockchain</div>
            <p className="mt-0.5">
              This credential was officially revoked by the authorized institution.
              {onChain.revocationReason && (
                <span className="block mt-1 font-mono text-rose-200/90">
                  Audit Reason: &quot;{onChain.revocationReason}&quot;
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Diploma Presentation Card */}
      <div className="p-8 sm:p-14 rounded-3xl bg-[#0d121f] border-4 border-[#1e293b] shadow-2xl relative overflow-hidden mb-8">
        {/* Subtle watermark / seal background */}
        <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] pointer-events-none">
          <Award className="w-96 h-96 text-white" />
        </div>

        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{institutionName}</h3>
              <span className="text-[11px] text-brand-300 font-mono">Accredited Decentralized Credential</span>
            </div>
          </div>

          <StatusBadge status={status} size="md" />
        </div>

        {/* Certificate Centerpiece */}
        <div className="py-12 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-gray-400 font-medium mb-4">
            This is to certify that
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 font-serif">
            {metadata.recipientName}
          </h1>
          <p className="text-xs text-gray-400 max-w-lg mx-auto mb-8 leading-relaxed">
            has successfully fulfilled all course requirements and demonstrated technical competency in
          </p>
          <div className="inline-block px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-xl sm:text-2xl font-bold text-brand-300 mb-6">
            {metadata.title}
          </div>
          <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
            {metadata.description}
          </p>
        </div>

        {/* Bottom Details & Signatures */}
        <div className="pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Issue Date</div>
            <div className="text-xs font-semibold text-gray-200 font-mono">{formatDate(Number(onChain.issuedAt))}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              Validity: {onChain.expiresAt === 0n ? 'Lifetime' : formatDate(Number(onChain.expiresAt))}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center text-center">
            {qrUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={qrUrl} alt="Verify QR" className="w-20 h-20 rounded-lg p-1 bg-white shadow" />
            ) : (
              <QrCode className="w-20 h-20 text-gray-500" />
            )}
            <Link
              href={`/verify/${id}`}
              className="text-[9px] font-mono text-brand-400 hover:underline mt-1 flex items-center gap-0.5"
            >
              <span>Verify On-Chain</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Certificate ID</div>
            <div className="text-xs font-bold text-white font-mono">{onChain.certificateId}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
              Issuer: {formatAddress(onChain.issuer, 4)}
            </div>
          </div>
        </div>
      </div>

      {/* Proof Footnote */}
      <Card className="p-6 text-xs font-mono space-y-2 text-gray-400">
        <div className="text-xs uppercase tracking-wider font-semibold text-white mb-2">
          Blockchain Integrity Record
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-gray-500">Document Fingerprint:</span>
          <span className="text-gray-300 break-all">{onChain.certificateHash}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-gray-500">Storage Anchor:</span>
          <span className="text-indigo-300 break-all">{onChain.metadataURI}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-gray-500">Status:</span>
          <span className={status === 'VERIFIED' ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
            {status}
          </span>
        </div>
      </Card>

      {/* Cryptographic Document Integrity Verification */}
      <IntegrityVerificationCard
        certificateId={onChain.certificateId}
        blockchainHash={onChain.certificateHash}
        metadataURI={onChain.metadataURI}
        pdfDownloadHandler={handleDownload}
      />

    </div>

  );
}
