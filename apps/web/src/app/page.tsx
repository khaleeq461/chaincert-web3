import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  FileSearch,
  Lock,
  ArrowRight,
  Database,
  QrCode,
  CheckCircle,
  FileCheck2,
  Cpu,
  Layers,
  FileText,
  AlertOctagon,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 overflow-hidden border-b border-card-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(79,70,229,0.12),rgba(10,13,20,0))] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Decentralized Credential Verification Protocol
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Verify Credentials. <br />
            <span className="gradient-text">Trust the Blockchain.</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            ChainCert makes academic and professional certificates tamper-evident and independently verifiable.
            Issuing institutions record cryptographic proofs on-chain, while public verifiers confirm validity instantly without a Web3 wallet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/verify" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto group">
                <FileSearch className="w-4 h-4" />
                Verify a Certificate
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Button>
            </Link>

            <Link href="/issuer/issue" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <Award className="w-4 h-4 text-brand-400" />
                Issue a Certificate
              </Button>
            </Link>
          </div>

          {/* Quick verification demo link */}
          <div className="mt-8 text-xs text-gray-500">
            <span>Want to test an authentic sample? </span>
            <Link href="/verify/CC-2026-000001" className="text-brand-400 hover:text-brand-300 underline font-mono">
              View CC-2026-000001
            </Link>
          </div>
        </div>
      </section>

      {/* 1. Problem Section */}
      <section className="py-20 px-4 sm:px-6 border-b border-card-border bg-card/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-2">The Critical Problem</h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">The Credential Integrity Crisis</h3>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              Paper certificates and centralized PDFs can easily be forged, doctored, or falsified using standard design software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-card-border bg-card/60">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Unchecked Forgery</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Counterfeit degrees and fake professional licenses have proliferated, undermining the credibility of honest degree holders and institutions.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/60">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Manual Verification Friction</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Employers spend days or weeks contacting universities and registries manually, creating major hiring bottlenecks and operational overhead.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/60">
              <div className="w-10 h-10 rounded-xl bg-gray-500/10 border border-gray-500/20 text-gray-400 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Centralized Vulnerability</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Centralized databases are single points of failure susceptible to server outages, insider tampering, unauthorized edits, and silent data loss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Solution Section */}
      <section className="py-20 px-4 sm:px-6 border-b border-card-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-2">The ChainCert Solution</h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">Cryptographic Truth & Decentralized Verification</h3>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              By anchoring proof of authenticity to EVM smart contracts, ChainCert replaces human trust with mathematical certainty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-card-border bg-card/50 flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Blockchain as Source of Truth</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Certificate fingerprints, validity periods, authorized issuers, and revocation records are immutably preserved on EVM smart contracts.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-card-border bg-card/50 flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Decentralized IPFS Storage</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Full document JSON metadata and academic transcripts are stored on IPFS, removing reliance on proprietary proprietary silos.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-card-border bg-card/50 flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Zero-Wallet Public Verification</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Employers and recruiters verify credentials directly in the browser without needing cryptocurrency, MetaMask, or account sign-ups.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture Card */}
            <div className="p-6 rounded-2xl border border-brand-500/20 bg-brand-950/20 text-xs font-mono space-y-4">
              <div className="text-xs uppercase tracking-wider text-brand-400 font-semibold mb-3">
                Decentralized Architecture Model
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-2">
                <div className="text-white font-bold">1. Blockchain (Smart Contract)</div>
                <div className="text-gray-400 text-[11px]">→ Authority, Certificate Hash, Active / Revoked Status</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-2">
                <div className="text-white font-bold">2. Decentralized Storage (IPFS)</div>
                <div className="text-gray-400 text-[11px]">→ PDF Document, Full Metadata JSON, Recipient Profile</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-2">
                <div className="text-white font-bold">3. Public Verifier Client (Viem / RPC)</div>
                <div className="text-gray-400 text-[11px]">→ Reads smart contract directly, checks hash integrity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How Blockchain Works Section */}
      <section className="py-20 px-4 sm:px-6 border-b border-card-border bg-card/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-2">EVM Blockchain Mechanics</h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">Why Blockchain Is the Gold Standard</h3>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              Unlike traditional databases where database administrators can secretly modify or delete records, blockchain enforces mathematically immutable guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-card-border bg-card/60">
              <div className="text-brand-400 font-mono text-xs mb-2">01 / IMMUTABILITY</div>
              <h4 className="text-sm font-semibold text-white mb-2">Append-Only Ledger</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Once a certificate transaction is mined into a block, its timestamp and data can never be altered or retroactively deleted.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-card-border bg-card/60">
              <div className="text-brand-400 font-mono text-xs mb-2">02 / CRYPTOGRAPHY</div>
              <h4 className="text-sm font-semibold text-white mb-2">SHA-256 Digest</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                A 32-byte cryptographic hash binds the off-chain certificate payload to the on-chain registry. Changing a single character breaks verification.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-card-border bg-card/60">
              <div className="text-brand-400 font-mono text-xs mb-2">03 / RBAC</div>
              <h4 className="text-sm font-semibold text-white mb-2">Cryptographic Keys</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Only institutions holding the authorized private key (`ISSUER_ROLE`) can sign issuance transactions, eliminating forged origins.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-card-border bg-card/60">
              <div className="text-brand-400 font-mono text-xs mb-2">04 / TRANSPARENCY</div>
              <h4 className="text-sm font-semibold text-white mb-2">Independent Audit</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Anyone on earth with internet access can independently query the smart contract and confirm issuance history with zero gatekeepers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section className="py-20 px-4 sm:px-6 border-b border-card-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-2">Platform Capabilities</h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">Enterprise Features Built for Higher Ed</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-card-border bg-card/50">
              <QrCode className="w-6 h-6 text-brand-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-2">Instant QR Code Verification</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Every credential includes a vector QR code directing verifiers directly to the tamper-evident validation portal.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/50">
              <AlertOctagon className="w-6 h-6 text-rose-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-2">On-Chain Revocation Trail</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Institutions can revoke compromised certificates. The on-chain timestamp and audit reason are permanently recorded.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/50">
              <Cpu className="w-6 h-6 text-indigo-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-2">Automated Expiry Support</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Time-limited certifications automatically transition to EXPIRED on-chain based on blockchain block timestamps.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/50">
              <Lock className="w-6 h-6 text-emerald-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-2">Strict Role-Based Security</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                OpenZeppelin AccessControl ensures that even the platform admin cannot fabricate or alter an issuer&apos;s certificate.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/50">
              <FileText className="w-6 h-6 text-amber-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-2">Printable PDF Diplomas</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                High-resolution diploma generation with cryptographic hashes, authorized seals, and embedded verification QR codes.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/50">
              <Users className="w-6 h-6 text-cyan-400 mb-4" />
              <h4 className="text-base font-semibold text-white mb-2">Student Credential Vault</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Students connect their Ethereum wallet to view all credentials, download verified documents, and share public profiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Verification Process Flow */}
      <section className="py-20 px-4 sm:px-6 border-b border-card-border bg-card/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-2">End-to-End Workflow</h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">The Verification Lifecycle</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl border border-card-border bg-card/60 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Issuance & Hashing</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Authorized university uploads metadata to IPFS, computes cryptographic digest, and signs on-chain transaction.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/60 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Delivery & QR Code</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Student receives the credential in their vault with a permanent QR verification link (`/verify/[id]`).
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/60 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Instant Public Audit</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Employer scans QR code or enters ID. The portal queries smart contract state and matches the IPFS hash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Security Section */}
      <section className="py-20 px-4 sm:px-6 border-b border-card-border">
        <div className="max-w-5xl mx-auto">
          <div className="p-8 rounded-3xl border border-brand-500/20 bg-gradient-to-b from-brand-950/20 to-card/40 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4">
                <ShieldCheck className="w-4 h-4" />
                Security First-Principles
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Engineered for Zero Data Tampering</h3>
              <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                ChainCert implements OpenZeppelin ReentrancyGuard, strict duplicate ID prevention, address sanitization,
                and decentralized IPFS pinning. No private keys are stored on servers or client source code.
              </p>
            </div>
            <Link href="/docs">
              <Button variant="outline" size="md">
                Read Security Spec
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Team Section */}
      <section className="py-20 px-4 sm:px-6 bg-card/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-2">Academic Final Project</h2>
          <h3 className="text-3xl font-bold text-white tracking-tight mb-4">Engineering Capstone Team</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-12">
            Designed, implemented, and defended for a 6-month Blockchain / Web3 Engineering Course.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="p-6 rounded-2xl border border-card-border bg-card/70 text-left hover:border-brand-500/30 transition">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center mb-4">
                KR
              </div>
              <h4 className="text-lg font-bold text-white">Khaleeq ur Rahman</h4>
              <div className="text-xs text-brand-400 font-medium mb-2">Web3 / Blockchain Engineer</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Smart contract development, cryptographic hashing architecture, OpenZeppelin access-control security, and EVM testing.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-card-border bg-card/70 text-left hover:border-brand-500/30 transition">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center mb-4">
                S
              </div>
              <h4 className="text-lg font-bold text-white">Shahab</h4>
              <div className="text-xs text-brand-400 font-medium mb-2">Web3 / Blockchain Engineer</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                DApp frontend engineering, decentralized IPFS integration, verification UX, and client-side cryptographic hashing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
