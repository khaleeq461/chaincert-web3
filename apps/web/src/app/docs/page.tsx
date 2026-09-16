import React from 'react';
import Link from 'next/link';
import { BookOpen, Code2, ShieldCheck, Terminal, HelpCircle, Layers, FileCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-medium mb-4">
          <BookOpen className="w-3.5 h-3.5 text-brand-400" />
          Technical Documentation & Developer Reference
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          ChainCert Documentation
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
          Comprehensive guide for integrating with the ChainCert smart contract, understanding cryptographic hashing, and executing public verification queries.
        </p>
      </div>

      <div className="space-y-12">
        {/* 1. Architecture Overview */}
        <section id="architecture">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            1. Core Architecture Principles
          </h2>
          <Card className="p-6 text-xs text-gray-300 leading-relaxed space-y-3">
            <p>
              ChainCert strictly adheres to on-chain source of truth with off-chain content storage:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono">
              <div className="p-3.5 rounded-xl bg-black/40 border border-card-border">
                <span className="text-brand-400 font-bold block mb-1">On-Chain (Smart Contract):</span>
                <span className="text-gray-400">
                  Certificate ID, Recipient Address, Issuer Address, Metadata IPFS URI, SHA-256 Digest, Issuance Timestamp, Expiry Timestamp, Revocation Flag, Revocation Reason.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-card-border">
                <span className="text-emerald-400 font-bold block mb-1">Off-Chain (IPFS):</span>
                <span className="text-gray-400">
                  Comprehensive academic transcripts, course descriptions, grades/honors, university logos, and vector printable certificate PDFs.
                </span>
              </div>
            </div>
          </Card>
        </section>

        {/* 2. Smart Contract Interface */}
        <section id="smart-contract">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            2. Smart Contract Methods (`IChainCert.sol`)
          </h2>
          <Card className="p-6 space-y-4">
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/40 border border-card-border">
                <div className="text-brand-300 font-bold">
                  function isCertificateValid(string calldata certificateId) external view returns (bool isValid, Status status)
                </div>
                <div className="text-gray-400 text-[11px] mt-1">
                  Public view endpoint that returns whether the certificate is authentic and valid, along with its status enum (NOT_FOUND = 0, VERIFIED = 1, REVOKED = 2, EXPIRED = 3).
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-card-border">
                <div className="text-brand-300 font-bold">
                  function issueCertificate(string calldata certificateId, address recipient, string calldata metadataURI, bytes32 certificateHash, uint64 expiresAt) external
                </div>
                <div className="text-gray-400 text-[11px] mt-1">
                  Restricted to accounts with <code className="text-emerald-400">ISSUER_ROLE</code>. Reverts with <code className="text-rose-400">CertificateAlreadyExists</code> if duplicate ID is submitted.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-card-border">
                <div className="text-brand-300 font-bold">
                  function revokeCertificate(string calldata certificateId, string calldata reason) external
                </div>
                <div className="text-gray-400 text-[11px] mt-1">
                  Can only be invoked by the issuing institution or the platform admin. Emits <code className="text-amber-400">CertificateRevoked</code> with reason.
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Developer Commands */}
        <section id="commands">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            3. Local Setup & Testing CLI
          </h2>
          <Card className="p-6 font-mono text-xs space-y-3">
            <div className="text-gray-400"># Install monorepo dependencies</div>
            <div className="bg-black/50 p-2.5 rounded-lg border border-card-border text-gray-200">
              npm install
            </div>

            <div className="text-gray-400 pt-2"># Run smart contract test suite (39 tests)</div>
            <div className="bg-black/50 p-2.5 rounded-lg border border-card-border text-gray-200">
              npm run contracts:test
            </div>

            <div className="text-gray-400 pt-2"># Run Hardhat local EVM node</div>
            <div className="bg-black/50 p-2.5 rounded-lg border border-card-border text-gray-200">
              npm run contracts:node
            </div>

            <div className="text-gray-400 pt-2"># Launch Next.js Web3 Frontend</div>
            <div className="bg-black/50 p-2.5 rounded-lg border border-card-border text-gray-200">
              npm run dev
            </div>
          </Card>
        </section>

        {/* 4. Frequently Asked Questions */}
        <section id="faq">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            4. Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card className="p-6">
              <h4 className="text-sm font-bold text-white mb-1.5">Does a recruiter need a crypto wallet to verify?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                No. The public verification page (`/verify/[id]`) uses a public EVM RPC provider. Anyone with a web browser or smartphone can verify certificates with zero crypto friction.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="text-sm font-bold text-white mb-1.5">Can an administrator secretly edit an issued certificate?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                No. By mathematical design of the smart contract, certificate records cannot be edited once issued. The only permitted post-issuance action is revocation, which emits a permanent, public audit event.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
