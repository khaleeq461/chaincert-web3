'use client';

import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  RefreshCw,
  Hash,
  Download,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  Bug
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { verifyDocumentIntegrity, computeFileKeccak256, IntegrityResult } from '@/lib/integrity';

interface IntegrityVerificationCardProps {
  certificateId: string;
  blockchainHash: string;
  metadataURI?: string;
  pdfDownloadHandler?: () => void;
}

export function IntegrityVerificationCard({
  certificateId,
  blockchainHash,
  metadataURI,
  pdfDownloadHandler,
}: IntegrityVerificationCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFetchingIpfs, setIsFetchingIpfs] = useState(false);
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [copiedBlockchainHash, setCopiedBlockchainHash] = useState(false);
  const [copiedCalculatedHash, setCopiedCalculatedHash] = useState(false);
  const [tamperMode, setTamperMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    await runVerification(file, false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    await runVerification(file, false);
  };

  const runVerification = async (file: File, simulateTamper = false) => {
    setIsVerifying(true);
    setTamperMode(simulateTamper);

    try {
      if (simulateTamper) {
        // Read file bytes and deliberately flip a single byte to demonstrate tamper detection
        const arrayBuffer = await file.arrayBuffer();
        const tamperedBytes = new Uint8Array(arrayBuffer);
        if (tamperedBytes.length > 10) {
          // Invert byte at position 10
          tamperedBytes[10] = tamperedBytes[10] ^ 0xff;
        }

        const res = await verifyDocumentIntegrity(
          tamperedBytes,
          blockchainHash,
          `${file.name} (Simulated 1-Byte Tampering)`
        );
        setResult(res);
      } else {
        const res = await verifyDocumentIntegrity(file, blockchainHash, file.name);
        setResult(res);
      }
    } catch (err) {
      console.error('Integrity calculation error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Test live IPFS content directly from decentralized storage
  const handleVerifyLiveIpfs = async () => {
    if (!metadataURI) return;
    setIsFetchingIpfs(true);
    setTamperMode(false);

    try {
      const cid = metadataURI.replace(/^ipfs:\/\//, '');
      const response = await fetch(`/api/ipfs/${cid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch IPFS content: ${response.status}`);
      }

      const blob = await response.blob();
      const res = await verifyDocumentIntegrity(blob, blockchainHash, `IPFS: ${cid}`);
      setSelectedFile(new File([blob], `${certificateId}-metadata.json`, { type: 'application/json' }));
      setResult(res);
    } catch (err) {
      console.error('Failed to verify live IPFS content:', err);
      alert('Unable to fetch live IPFS content from gateway.');
    } finally {
      setIsFetchingIpfs(false);
    }
  };

  const copyToClipboard = (text: string, type: 'blockchain' | 'calculated') => {
    navigator.clipboard.writeText(text);
    if (type === 'blockchain') {
      setCopiedBlockchainHash(true);
      setTimeout(() => setCopiedBlockchainHash(false), 2000);
    } else {
      setCopiedCalculatedHash(true);
      setTimeout(() => setCopiedCalculatedHash(false), 2000);
    }
  };

  return (
    <Card className="p-6 border-card-border bg-card/80 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-card-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Decentralized Storage & Content Integrity</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Cryptographic Document Integrity Verification
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Compare any downloaded certificate document against the immutable blockchain fingerprint.
          </p>
        </div>

        {metadataURI && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifyLiveIpfs}
            disabled={isFetchingIpfs || isVerifying}
            className="gap-1.5 self-start text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingIpfs ? 'animate-spin' : ''}`} />
            Verify Live IPFS Content
          </Button>
        )}
      </div>

      {/* Security Architecture Principle Alert */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-card-border text-[11px] text-gray-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Zero Trust Principle:</strong> Never claim document authenticity merely because an IPFS link exists. Authentic verification requires mathematical correspondence between the content hash and the smart contract state.
        </div>
      </div>

      {/* Authoritative Blockchain Fingerprint Display */}
      <div className="p-4 rounded-xl bg-black/50 border border-card-border space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="font-semibold text-gray-300 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-emerald-400" />
            Authoritative Blockchain Fingerprint (On-Chain Truth):
          </span>
          <button
            onClick={() => copyToClipboard(blockchainHash, 'blockchain')}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white flex items-center gap-1 text-[11px] transition cursor-pointer"
          >
            {copiedBlockchainHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Hash</span>
          </button>
        </div>
        <div className="font-mono text-emerald-400 text-xs sm:text-sm font-semibold break-all bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
          {blockchainHash}
        </div>
        <div className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
          <span>Algorithm: Keccak-256</span>
          <span>•</span>
          <span>Source: ChainCert Smart Contract Record</span>
        </div>
      </div>

      {/* File Upload / Drag & Drop Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="p-8 border-2 border-dashed border-card-border hover:border-brand-500/50 rounded-2xl bg-black/20 hover:bg-black/30 transition-all cursor-pointer text-center group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.json,application/pdf,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h4 className="text-sm font-bold text-white mb-1">
          Upload Certificate Document to Verify
        </h4>
        <p className="text-xs text-gray-400 max-w-sm mx-auto mb-3">
          Drop the downloaded certificate PDF or metadata JSON here to calculate its cryptographic digest.
        </p>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-300">
          <FileText className="w-3 h-3 text-brand-400" />
          Supports PDF diplomas & canonical JSON metadata
        </span>
      </div>

      {/* Active Verification Feedback & Match Result */}
      {result && (
        <div className="space-y-4 pt-2">
          {/* Status Result Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              result.isMatch
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  result.isMatch ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {result.isMatch ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertOctagon className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                      result.isMatch
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {result.isMatch ? 'MATCH (INTEGRITY CONFIRMED)' : 'MISMATCH (TAMPER DETECTED)'}
                  </span>
                  {tamperMode && (
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                      Tamper Simulation
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-white">
                  {result.isMatch
                    ? 'Cryptographic Document Integrity Verified'
                    : 'Cryptographic Fingerprint Mismatch'}
                </h4>
                <p className="text-xs leading-relaxed opacity-90">
                  {result.isMatch
                    ? 'The calculated cryptographic hash of this file matches the smart contract fingerprint byte-for-byte. The document has not been altered or tampered with since issuance.'
                    : 'The calculated hash does not correspond to the on-chain blockchain record. The document has been modified, corrupted, or was not issued on this certificate record.'}
                </p>
              </div>
            </div>

            {/* Test Tamper Simulation Trigger */}
            {selectedFile && (
              <div className="self-end sm:self-center shrink-0">
                {result.isMatch ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runVerification(selectedFile, true)}
                    className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 gap-1.5"
                    title="Deliberately alter 1 byte to demonstrate tamper detection"
                  >
                    <Bug className="w-3.5 h-3.5 text-amber-400" />
                    Simulate Tamper
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runVerification(selectedFile, false)}
                    className="text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    Restore Clean File
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Fingerprint Comparison Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Blockchain Record */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-card-border space-y-1.5">
              <span className="text-gray-400 text-[11px] block font-sans">
                Blockchain Fingerprint (On-Chain Registry):
              </span>
              <div className="text-emerald-400 break-all text-xs font-semibold">
                {result.blockchainHash}
              </div>
              <span className="text-[10px] text-gray-500 block font-sans">
                Authoritative truth anchored on Ethereum
              </span>
            </div>

            {/* Calculated Hash */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                result.isMatch
                  ? 'bg-black/40 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-[11px] font-sans">
                  Calculated Document Digest:
                </span>
                <button
                  onClick={() => copyToClipboard(result.calculatedHash, 'calculated')}
                  className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 font-sans"
                >
                  {copiedCalculatedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div
                className={`break-all text-xs font-semibold ${
                  result.isMatch ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.calculatedHash}
              </div>
              <span className="text-[10px] text-gray-500 block font-sans">
                Computed via Keccak-256 from {result.analyzedFileName || 'uploaded file'} ({result.analyzedFileSize} bytes)
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
