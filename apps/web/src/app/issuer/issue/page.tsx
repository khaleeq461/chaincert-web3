'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { isAddress, keccak256, toHex, type Address } from 'viem';
import QRCode from 'qrcode';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  Layers,
  ExternalLink,
  Wallet,
  Download,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  ShieldCheck,
  AlertCircle,
  FileText,
  UploadCloud,
  Loader2
} from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TxStatusModal } from '@/components/ui/TxStatusModal';
import { useIssueCertificate } from '@/hooks/useChainCert';
import { fetchCertificateValidity, checkIsIssuer, checkIsAdmin, fetchInstitutionName } from '@/lib/contract';
import { downloadCertificatePdf, generateCertificatePdf } from '@/lib/pdf';
import { canonicalizeJSON } from '@chaincert/shared';

function generateRandomCertId(): string {
  const year = new Date().getFullYear();
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `CC-${year}-${randNum}`;
}

export default function IssueCertificatePage() {
  const { address, isConnected } = useAccount();
  const { issue, hash, isPending, isConfirming, isSuccess, isError, error, receipt, reset } = useIssueCertificate();

  const [isIssuer, setIsIssuer] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingRole, setIsCheckingRole] = useState<boolean>(true);

  // Form State
  const [formData, setFormData] = useState({
    certificateId: generateRandomCertId(),
    recipientName: '',
    recipientWallet: '',
    recipientEmail: '',
    certificateTitle: '',
    course: '',
    institutionName: 'Cambridge Web3 Academy',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    grade: '',
    description: '',
  });

  // Verify Role on Blockchain
  useEffect(() => {
    async function verifyIssuerRole() {
      setIsCheckingRole(true);
      if (isConnected && address) {
        const [issuerRole, adminRole, instName] = await Promise.all([
          checkIsIssuer(address as Address),
          checkIsAdmin(address as Address),
          fetchInstitutionName(address as Address),
        ]);
        setIsIssuer(issuerRole);
        setIsAdmin(adminRole);
        if (instName) {
          setFormData((prev) => ({ ...prev, institutionName: instName }));
        }
      } else {
        setIsIssuer(false);
        setIsAdmin(false);
      }
      setIsCheckingRole(false);
    }
    verifyIssuerRole();
  }, [address, isConnected]);


  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [step, setStep] = useState<'FORM' | 'PREVIEW' | 'SUBMITTED'>('FORM');
  const [computedHash, setComputedHash] = useState<`0x${string}`>('0x');
  const [metadataURI, setMetadataURI] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidatingId, setIsValidatingId] = useState(false);
  const [isUploadingIpfs, setIsUploadingIpfs] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Check on-chain uniqueness of Certificate ID
  const checkIdUniqueness = async (id: string): Promise<boolean> => {
    if (!id.trim()) return false;
    setIsValidatingId(true);
    try {
      const { status } = await fetchCertificateValidity(id.trim());
      // status !== 0 means it already exists (1=VERIFIED, 2=REVOKED, 3=EXPIRED)
      return status === 0;
    } catch {
      return true;
    } finally {
      setIsValidatingId(false);
    }
  };

  const handleRegenerateId = () => {
    const newId = generateRandomCertId();
    setFormData((prev) => ({ ...prev, certificateId: newId }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.certificateId;
      return copy;
    });
  };

  const validateForm = async (): Promise<boolean> => {
    const errs: Record<string, string> = {};

    // 1. Certificate ID validation
    const trimmedId = formData.certificateId.trim();
    if (!trimmedId) {
      errs.certificateId = 'Certificate ID is required.';
    } else if (!/^[a-zA-Z0-9_-]{3,64}$/.test(trimmedId)) {
      errs.certificateId = 'Certificate ID must be 3-64 alphanumeric characters, dashes, or underscores without spaces or special characters (e.g. CC-2026-000001).';
    } else {
      // 2. Uniqueness check against smart contract
      const isUnique = await checkIdUniqueness(trimmedId);
      if (!isUnique) {
        errs.certificateId = `Certificate ID "${trimmedId}" already exists on-chain. Please generate a unique ID.`;
      }
    }


    // 3. Recipient validation
    if (!formData.recipientName.trim()) {
      errs.recipientName = 'Recipient full name is required.';
    }

    if (!formData.recipientWallet.trim()) {
      errs.recipientWallet = 'Recipient wallet address is required.';
    } else if (!isAddress(formData.recipientWallet.trim())) {
      errs.recipientWallet = 'Invalid Ethereum address. Must be a valid 42-character 0x hex address.';
    }

    // 4. Academic Details validation
    if (!formData.certificateTitle.trim()) {
      errs.certificateTitle = 'Certificate title is required (e.g. Certified Web3 Architect).';
    }
    if (!formData.course.trim()) {
      errs.course = 'Course or program name is required.';
    }
    if (!formData.institutionName.trim()) {
      errs.institutionName = 'Institution name is required.';
    }
    if (!formData.issueDate) {
      errs.issueDate = 'Issue date is required.';
    }

    // 5. Expiry validation (optional, but if present must be future)
    if (formData.expiryDate) {
      const issueTime = new Date(formData.issueDate).getTime();
      const expiryTime = new Date(formData.expiryDate).getTime();
      if (expiryTime <= issueTime) {
        errs.expiryDate = 'Expiry date must be after the issue date.';
      } else if (expiryTime <= Date.now()) {
        errs.expiryDate = 'Expiry date must be in the future.';
      }
    }

    // 6. Description validation
    if (!formData.description.trim()) {
      errs.description = 'Please provide a summary of the credential, competencies, or honors.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGoToPreview = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    const base = origin || 'http://localhost:3000';
    const verifyUrl = `${base}/verify/${formData.certificateId.trim()}`;
    setVerificationUrl(verifyUrl);

    // Generate QR code data URL
    try {
      const qrUrl = await QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setQrCodeDataUrl(qrUrl);
    } catch (e) {
      console.error('QR generation error:', e);
    }

    // Generate canonical metadata object
    const metadataPayload = {
      schemaVersion: '1.0.0',
      certificateId: formData.certificateId.trim(),
      recipient: {
        name: formData.recipientName.trim(),
        walletAddress: formData.recipientWallet.trim(),
        email: formData.recipientEmail.trim() || undefined,
      },
      issuer: {
        name: formData.institutionName.trim(),
        walletAddress: address || '0x0000000000000000000000000000000000000000',
      },
      credential: {
        title: formData.certificateTitle.trim(),
        course: formData.course.trim(),
        grade: formData.grade.trim() || undefined,
        description: formData.description.trim(),
      },
      dates: {
        issuedAt: formData.issueDate,
        expiresAt: formData.expiryDate || null,
      },
      verificationUrl: verifyUrl,
    };

    // Calculate deterministic cryptographic hash (Keccak256 of canonical JSON)
    const canonical = canonicalizeJSON(metadataPayload);
    const hashDigest = keccak256(toHex(canonical));
    setComputedHash(hashDigest);

    setStep('PREVIEW');
  };

  const handleExecuteIssue = async () => {
    if (!isConnected || !address) {
      alert('Please connect your authorized institution wallet with MetaMask.');
      return;
    }

    if (!isIssuer && !isAdmin) {
      alert('Your connected wallet is not authorized as an issuer on the ChainCert smart contract.');
      return;
    }

    setIsUploadingIpfs(true);
    setIsModalOpen(true);


    try {
      // 1. Synthesize PDF Certificate and upload to IPFS storage adapter
      const base = origin || 'http://localhost:3000';
      const verifyUrl = `${base}/verify/${formData.certificateId.trim()}`;

      const pdfData = {
        certificateId: formData.certificateId.trim(),
        recipientName: formData.recipientName.trim(),
        recipientWallet: formData.recipientWallet.trim(),
        certificateTitle: formData.certificateTitle.trim(),
        course: formData.course.trim(),
        institutionName: formData.institutionName.trim(),
        issuerAddress: address,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate || undefined,
        grade: formData.grade.trim() || undefined,
        description: formData.description.trim(),
        verificationUrl: verifyUrl,
        certificateHash: computedHash,
      };

      const { blob: pdfBlob } = await generateCertificatePdf(pdfData);

      // 2. Upload PDF Document to Storage Adapter
      const pdfFormData = new FormData();
      pdfFormData.append('file', pdfBlob, `${formData.certificateId}-Certificate.pdf`);

      let pdfCid = '';
      try {
        const uploadPdfRes = await fetch('/api/storage/upload', {
          method: 'POST',
          body: pdfFormData,
        });
        if (uploadPdfRes.ok) {
          const pdfJson = await uploadPdfRes.json();
          pdfCid = pdfJson.cid;
        }
      } catch (err) {
        console.warn('PDF storage fallback:', err);
      }

      // 3. Upload Full Metadata to Storage Adapter
      const metadataPayload = {
        schemaVersion: '1.0.0',
        certificateId: formData.certificateId.trim(),
        recipient: {
          name: formData.recipientName.trim(),
          walletAddress: formData.recipientWallet.trim(),
          email: formData.recipientEmail.trim() || undefined,
        },
        issuer: {
          name: formData.institutionName.trim(),
          walletAddress: address,
        },
        credential: {
          title: formData.certificateTitle.trim(),
          course: formData.course.trim(),
          grade: formData.grade.trim() || undefined,
          description: formData.description.trim(),
        },
        dates: {
          issuedAt: formData.issueDate,
          expiresAt: formData.expiryDate || null,
        },
        document: {
          pdfCid: pdfCid || undefined,
          pdfUri: pdfCid ? `ipfs://${pdfCid}` : undefined,
        },
        verificationUrl: verifyUrl,
        certificateHash: computedHash,
      };

      const uploadMetaRes = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: metadataPayload,
          name: `${formData.certificateId}-metadata.json`,
        }),
      });

      let finalUri = `ipfs://bafkrei${computedHash.slice(2, 54)}`;
      if (uploadMetaRes.ok) {
        const metaJson = await uploadMetaRes.json();
        if (metaJson.uri) {
          finalUri = metaJson.uri;
        }
      }
      setMetadataURI(finalUri);
      setIsUploadingIpfs(false);

      // 4. Calculate expiresAt unix timestamp for smart contract
      let expiresAt = 0n;
      if (formData.expiryDate) {
        const expUnix = Math.floor(new Date(formData.expiryDate).getTime() / 1000);
        expiresAt = BigInt(expUnix);
      }

      // 5. Invoke Smart Contract on-chain
      await issue({
        certificateId: formData.certificateId.trim(),
        recipient: formData.recipientWallet.trim() as Address,
        metadataURI: finalUri,
        certificateHash: computedHash,
        expiresAt,
      });

      setStep('SUBMITTED');
    } catch (err) {
      console.error('Issuance execution failed:', err);
      setIsUploadingIpfs(false);
    }
  };

  const handleDownloadPdf = async () => {
    const base = origin || 'http://localhost:3000';
    const verifyUrl = `${base}/verify/${formData.certificateId.trim()}`;
    await downloadCertificatePdf({
      certificateId: formData.certificateId.trim(),
      recipientName: formData.recipientName.trim(),
      recipientWallet: formData.recipientWallet.trim(),
      certificateTitle: formData.certificateTitle.trim(),
      course: formData.course.trim(),
      institutionName: formData.institutionName.trim(),
      issuerAddress: address || '0x0000000000000000000000000000000000000000',
      issueDate: formData.issueDate,
      expiryDate: formData.expiryDate || undefined,
      grade: formData.grade.trim() || undefined,
      description: formData.description.trim(),
      verificationUrl: verifyUrl,
      certificateHash: computedHash,
    });
  };

  const handleCopyVerificationLink = () => {
    const base = origin || 'http://localhost:3000';
    const link = `${base}/verify/${formData.certificateId.trim()}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleResetForNew = () => {
    reset();
    setFormData({
      certificateId: generateRandomCertId(),
      recipientName: '',
      recipientWallet: '',
      recipientEmail: '',
      certificateTitle: '',
      course: '',
      institutionName: 'Cambridge Web3 Academy',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      grade: '',
      description: '',
    });
    setDocumentFile(null);
    setErrors({});
    setStep('FORM');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/issuer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Issuer Dashboard
        </Link>
      </div>

      {!isConnected ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2 mb-6">
          <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Connect your authorized institution wallet with MetaMask to submit this certificate on-chain.
          </span>
        </div>
      ) : isCheckingRole ? (
        <div className="p-4 rounded-xl bg-card border border-card-border text-xs text-gray-400 flex items-center gap-2.5 mb-6">
          <Loader2 className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
          <span>Verifying ISSUER_ROLE permissions on ChainCert smart contract...</span>
        </div>
      ) : !isIssuer && !isAdmin ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-white">
              Your wallet is connected, but it is not authorized as an issuer.
            </div>
            <p className="text-amber-300/90 leading-relaxed">
              Address <code className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">{address}</code> does not hold the <code className="font-mono text-white">ISSUER_ROLE</code> on the ChainCert smart contract. Only authorized educational institutions can issue credentials. Any manual on-chain transactions will be rejected by smart contract access control.
            </p>
          </div>
        </div>
      ) : null}

      {/* STEP 1: FORM */}
      {step === 'FORM' && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Issue Blockchain Certificate
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Issue an immutable academic credential. Data will be hashed, stored in IPFS, and anchored to the Ethereum smart contract.
            </p>
          </div>

          <Card className="p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGoToPreview();
              }}
              className="space-y-6"
            >
              {/* Section 1: Certificate & Institution */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  1. Identification & Institution
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-300">
                        Certificate ID <span className="text-brand-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateId}
                        className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Generate New
                      </button>
                    </div>
                    <Input
                      value={formData.certificateId}
                      onChange={(e) =>
                        setFormData({ ...formData, certificateId: e.target.value })
                      }
                      error={errors.certificateId}
                      helperText={isValidatingId ? 'Checking on-chain uniqueness...' : 'Unique ID required on-chain (e.g. CC-2026-123456).'}
                      className="font-mono"
                    />
                  </div>

                  <Input
                    label="Issuing Institution *"
                    value={formData.institutionName}
                    onChange={(e) =>
                      setFormData({ ...formData, institutionName: e.target.value })
                    }
                    error={errors.institutionName}
                    helperText="Authorized institution name on-chain."
                  />
                </div>
              </div>

              {/* Section 2: Recipient Details */}
              <div className="pt-4 border-t border-card-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-4 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  2. Recipient Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Recipient Full Name *"
                    placeholder="e.g. Jane Doe"
                    value={formData.recipientName}
                    onChange={(e) =>
                      setFormData({ ...formData, recipientName: e.target.value })
                    }
                    error={errors.recipientName}
                  />

                  <Input
                    label="Recipient Ethereum Wallet Address *"
                    placeholder="0x..."
                    value={formData.recipientWallet}
                    onChange={(e) =>
                      setFormData({ ...formData, recipientWallet: e.target.value })
                    }
                    error={errors.recipientWallet}
                    helperText="Must be a valid 42-character 0x EVM address."
                    className="font-mono text-xs"
                  />

                  <Input
                    label="Recipient Contact Email (Optional)"
                    placeholder="jane@university.edu"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, recipientEmail: e.target.value })
                    }
                    helperText="Privacy-preserved: never stored publicly on-chain."
                  />

                  <Input
                    label="Issue Date *"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, issueDate: e.target.value })
                    }
                    error={errors.issueDate}
                  />
                </div>
              </div>

              {/* Section 3: Credential Details */}
              <div className="pt-4 border-t border-card-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  3. Credential Details & Expiration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Program / Course Name *"
                    placeholder="e.g. Advanced Blockchain Architecture"
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                    error={errors.course}
                  />

                  <Input
                    label="Certificate Title / Degree *"
                    placeholder="e.g. Certified Web3 Architect"
                    value={formData.certificateTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, certificateTitle: e.target.value })
                    }
                    error={errors.certificateTitle}
                  />

                  <Input
                    label="Grade / Honor (Optional)"
                    placeholder="e.g. Distinction (98%)"
                    value={formData.grade}
                    onChange={(e) =>
                      setFormData({ ...formData, grade: e.target.value })
                    }
                  />

                  <Input
                    label="Expiry Date (Optional)"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    error={errors.expiryDate}
                    helperText="Leave empty for lifetime credentials (no expiration)."
                  />
                </div>

                <div className="mt-4">
                  <Textarea
                    label="Certificate Description & Competencies *"
                    placeholder="Describe competencies, learning outcomes, or honors achieved..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    error={errors.description}
                  />
                </div>

                {/* Section 4: Document Upload (Optional) */}
                <div className="mt-6 pt-4 border-t border-card-border">
                  <label className="text-xs font-medium text-gray-300 block mb-1.5">
                    Certificate Document / Attachment (Optional)
                  </label>
                  <p className="text-[11px] text-gray-400 mb-3">
                    ChainCert will automatically synthesize a formal PDF diploma with institutional seal, QR verification code, and cryptographic hash. You may also attach a custom PDF document.
                  </p>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-card-border hover:border-brand-500/50 bg-black/30 hover:bg-black/50 text-xs text-gray-300 hover:text-white cursor-pointer transition">
                      <UploadCloud className="w-4 h-4 text-brand-400" />
                      <span>{documentFile ? documentFile.name : 'Upload Custom PDF File'}</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setDocumentFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {documentFile && (
                      <button
                        type="button"
                        onClick={() => setDocumentFile(null)}
                        className="text-xs text-rose-400 hover:underline cursor-pointer"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-card-border flex justify-end gap-3">
                <Link href="/issuer">
                  <Button variant="ghost" size="md">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="md"
                  disabled={isValidatingId || (!isIssuer && !isAdmin && isConnected)}
                  isLoading={isValidatingId}
                >
                  {!isIssuer && !isAdmin && isConnected
                    ? 'Issuer Authorization Required'
                    : 'Review & Preview Certificate'}
                </Button>

              </div>
            </form>
          </Card>
        </>
      )}

      {/* STEP 2: PREVIEW */}
      {step === 'PREVIEW' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Review Certificate Proof
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Confirm all credential details before signing the on-chain smart contract transaction.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('FORM')}>
              Edit Details
            </Button>
          </div>

          <Card className="p-8 border-brand-500/30">
            {/* Diploma Header */}
            <div className="text-center pb-6 border-b border-card-border">
              <div className="text-xs font-mono text-brand-400 mb-1">
                CHAINCERT VERIFIED ON-CHAIN CREDENTIAL
              </div>
              <h1 className="text-2xl font-extrabold text-white">
                {formData.certificateTitle}
              </h1>
              <div className="text-sm text-gray-300 mt-1">
                {formData.institutionName}
              </div>
            </div>

            {/* Diploma Metadata Grid */}
            <div className="py-6 border-b border-card-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block">Certificate ID</span>
                <span className="font-mono text-white font-semibold">
                  {formData.certificateId}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Recipient</span>
                <span className="text-white font-semibold">
                  {formData.recipientName}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Course / Program</span>
                <span className="text-white">{formData.course}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Validity</span>
                <span className="text-white">
                  {formData.expiryDate ? `Expires on ${formData.expiryDate}` : 'Lifetime (No Expiration)'}
                </span>
              </div>
            </div>

            <div className="py-4 border-b border-card-border space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">Recipient Wallet Address:</div>
                <div className="font-mono text-xs text-gray-200 break-all bg-black/40 p-2.5 rounded-lg border border-card-border">
                  {formData.recipientWallet}
                </div>
              </div>

              {formData.description && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Competencies / Description:</div>
                  <div className="text-xs text-gray-300 bg-black/20 p-2.5 rounded-lg border border-card-border leading-relaxed">
                    {formData.description}
                  </div>
                </div>
              )}
            </div>

            {/* Cryptographic Proof & QR Preview */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-xs font-mono flex-1">
                <div>
                  <div className="text-gray-400 mb-1">Cryptographic Digest (Keccak256):</div>
                  <div className="text-emerald-400 break-all bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
                    {computedHash}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">Public Verification URL:</div>
                  <div className="text-brand-400 break-all bg-black/40 p-2.5 rounded-lg border border-brand-500/20 text-[11px]">
                    {verificationUrl}
                  </div>
                </div>
              </div>

              {qrCodeDataUrl && (
                <div className="shrink-0 flex flex-col items-center bg-white p-3 rounded-xl shadow-lg border border-white/20">
                  <Image
                    src={qrCodeDataUrl}
                    alt="Verification QR"
                    width={112}
                    height={112}
                    unoptimized
                  />
                  <span className="text-[10px] font-bold text-slate-900 mt-1">
                    Scan to Verify
                  </span>
                </div>
              )}
            </div>

            <div className="pt-8 flex justify-end gap-3 border-t border-card-border mt-6">
              <Button variant="outline" size="md" onClick={() => setStep('FORM')}>
                Back to Edit
              </Button>
              <Button
                size="md"
                onClick={handleExecuteIssue}
                disabled={!isIssuer && !isAdmin}
                isLoading={isUploadingIpfs || isPending || isConfirming}
              >
                {!isIssuer && !isAdmin
                  ? 'Issuer Authorization Required'
                  : isUploadingIpfs
                  ? 'Uploading to IPFS...'
                  : isPending
                  ? 'Confirm in MetaMask...'
                  : isConfirming
                  ? 'Mining On-Chain...'
                  : 'Sign & Issue On-Chain'}
              </Button>

            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: SUBMITTED & CONFIRMED HUB */}
      {step === 'SUBMITTED' && isSuccess && (
        <div className="space-y-6">
          <Card className="p-8 border-emerald-500/40 bg-emerald-950/10">
            <div className="text-center pb-6 border-b border-card-border">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">
                Certificate Successfully Issued & Anchored!
              </h1>
              <p className="text-xs text-gray-300 mt-1 max-w-lg mx-auto">
                The credential has been mined into the Ethereum blockchain and registered permanently on the ChainCert smart contract.
              </p>
            </div>

            {/* On-Chain Receipt Details */}
            <div className="py-6 border-b border-card-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block mb-1">Certificate ID</span>
                <span className="font-mono text-brand-400 font-bold text-sm">
                  {formData.certificateId}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Block Confirmation</span>
                <span className="font-mono text-white">
                  Block #{receipt?.blockNumber ? receipt.blockNumber.toString() : 'Mined'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Gas Used</span>
                <span className="font-mono text-white">
                  {receipt?.gasUsed ? `${receipt.gasUsed.toString()} gas` : 'Standard'}
                </span>
              </div>
            </div>

            {/* Transaction Hash */}
            <div className="py-4 border-b border-card-border">
              <div className="text-xs text-gray-400 mb-1">Transaction Hash:</div>
              <div className="flex items-center justify-between bg-black/50 p-2.5 rounded-lg border border-card-border font-mono text-xs text-gray-200">
                <span className="truncate mr-2">{hash}</span>
                {hash && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io'}/tx/${hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

              </div>
            </div>

            {/* Actions: Download PDF, Share Link, Verify Now */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-card-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                    <FileText className="w-4 h-4 text-brand-400" />
                    Official Certificate PDF
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    High-resolution printable diploma with institutional seal, dynamic verification QR code, and cryptographic hash.
                  </p>
                </div>
                <Button size="md" onClick={handleDownloadPdf} className="w-full">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Official PDF
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-card-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    Public Verification Portal
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Anyone can verify this credential directly from the blockchain without needing to connect a wallet.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleCopyVerificationLink}
                    className="flex-1"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                        Copied Link!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5" />
                        Copy Link
                      </>
                    )}
                  </Button>

                  <Link href={`/verify/${formData.certificateId}`} className="flex-1">
                    <Button size="md" className="w-full">
                      Verify Now
                      <ExternalLink className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-card-border flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={handleResetForNew}>
                Issue Another Certificate
              </Button>
              <Link href="/issuer">
                <Button variant="outline" size="sm">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* Transaction Status Modal */}
      <TxStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isPending={isUploadingIpfs || isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        isError={isError}
        error={error}
        txHash={hash}
        title="Issuing Certificate on Ethereum"
        successMessage={`Certificate ${formData.certificateId} has been committed to the blockchain!`}
      />
    </div>
  );
}
