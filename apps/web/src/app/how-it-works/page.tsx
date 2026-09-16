import React from 'react';
import Link from 'next/link';
import {
  Layers,
  ShieldCheck,
  Database,
  QrCode,
  FileCheck2,
  Lock,
  ArrowRight,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-medium mb-4">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          Protocol Architecture & Cryptography
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          How ChainCert Works
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          A step-by-step breakdown of how cryptographic hashing, decentralized IPFS storage, and EVM smart contracts eliminate academic credential fraud.
        </p>
      </div>

      {/* 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <Card className="p-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
            <Fingerprint className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">1. Deterministic Cryptographic Digest</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            When a university creates a certificate, all academic details (recipient name, program, grades, issuer wallet, timestamps) are compiled into a canonical JSON structure and digested with SHA-256 / keccak256 into a 32-byte hash.
          </p>
        </Card>

        <Card className="p-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">2. Off-Chain IPFS Content Layer</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Storing large PDF files directly on the Ethereum blockchain is cost-prohibitive. ChainCert uploads the full certificate metadata and PDF to IPFS (InterPlanetary File System), receiving an immutable content-addressed CID (<code className="text-indigo-300">ipfs://Qm...</code>).
          </p>
        </Card>

        <Card className="p-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">3. On-Chain Smart Contract Proof</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The authorized university signs a transaction to <code className="text-emerald-300 font-mono">ChainCert.sol</code> committing the Certificate ID, recipient address, IPFS URI, and cryptographic hash. Only accounts with <code className="text-white font-mono">ISSUER_ROLE</code> can execute this.
          </p>
        </Card>

        <Card className="p-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">4. Zero-Friction Public Verification</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            A vector QR code embedded in the diploma points to <code className="text-cyan-300">/verify/[id]</code>. The verifier’s browser directly queries the smart contract over public RPC, re-computes the IPFS content hash, and verifies mathematical equivalence.
          </p>
        </Card>
      </div>

      {/* Lifecycle Diagram Card */}
      <Card className="p-8 mb-16">
        <h3 className="text-base font-bold text-white mb-6">Complete Certificate Lifecycle States</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-black/40 border border-card-border">
            <div className="text-xs font-mono text-gray-400 mb-1">State 0</div>
            <div className="text-sm font-bold text-gray-300">NOT_FOUND</div>
            <p className="text-[10px] text-gray-500 mt-1">ID has never been registered on-chain</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-xs font-mono text-emerald-400 mb-1">State 1</div>
            <div className="text-sm font-bold text-emerald-400">VERIFIED</div>
            <p className="text-[10px] text-emerald-300/80 mt-1">Authentic, active, and valid</p>
          </div>

          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="text-xs font-mono text-rose-400 mb-1">State 2</div>
            <div className="text-sm font-bold text-rose-400">REVOKED</div>
            <p className="text-[10px] text-rose-300/80 mt-1">Revoked by authorized issuer on-chain</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-xs font-mono text-amber-400 mb-1">State 3</div>
            <div className="text-sm font-bold text-amber-400">EXPIRED</div>
            <p className="text-[10px] text-amber-300/80 mt-1">Validity window elapsed based on block.timestamp</p>
          </div>
        </div>
      </Card>

      {/* CTA Box */}
      <div className="text-center">
        <Link href="/verify">
          <Button size="lg">
            Try Verification Demo
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
