import React from 'react';
import Link from 'next/link';
import { Users, GraduationCap, Award, ShieldCheck, Code2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TeamPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-medium mb-4">
          <GraduationCap className="w-3.5 h-3.5 text-brand-400" />
          Academic Capstone Defense
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          The Engineering Team
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          ChainCert was architected and built as the final capstone project for a comprehensive 6-month Blockchain & Web3 Engineering course.
        </p>
      </div>

      {/* Team Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Khaleeq ur Rahman */}
        <Card className="p-8 border-brand-500/20 bg-card/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand-500/20">
                KR
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Khaleeq ur Rahman</h2>
                <div className="text-xs text-brand-400 font-medium">Web3 / Blockchain Engineer</div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">Core Protocol Architecture</div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed border-t border-card-border pt-4 mb-6">
              <p>
                Lead for the Ethereum smart contract registry, cryptographic fingerprinting protocols, and on-chain security.
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 text-[11px]">
                <li>Designed <code className="text-gray-200">ChainCert.sol</code> using Solidity 0.8.24 and OpenZeppelin v5</li>
                <li>Implemented RBAC role-gating (Admin & Issuer roles)</li>
                <li>Authored automated test suite with 39 passing Hardhat unit tests</li>
                <li>Formulated gas-optimized storage structures and anti-collision checks</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-card-border flex items-center justify-between text-xs text-gray-500">
            <span>Specialization: Smart Contracts & Security</span>
            <span className="text-brand-400 font-mono">Solidity / Hardhat</span>
          </div>
        </Card>

        {/* Shahab */}
        <Card className="p-8 border-brand-500/20 bg-card/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
                S
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Shahab</h2>
                <div className="text-xs text-brand-400 font-medium">Web3 / Blockchain Engineer</div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">DApp Architecture & Storage</div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed border-t border-card-border pt-4 mb-6">
              <p>
                Lead for the frontend application layer, decentralized IPFS storage integration, and public zero-wallet verification UX.
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 text-[11px]">
                <li>Engineered Next.js 15 App Router DApp with Tailwind CSS design system</li>
                <li>Configured wagmi v2 and public viem RPC integration</li>
                <li>Integrated IPFS content-addressed metadata generation and SHA-256 validation</li>
                <li>Built dynamic vector QR code engine and institutional certificate UI</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-card-border flex items-center justify-between text-xs text-gray-500">
            <span>Specialization: Full-Stack Web3 & IPFS</span>
            <span className="text-brand-400 font-mono">Next.js / wagmi / viem</span>
          </div>
        </Card>
      </div>

      {/* Capstone Context */}
      <Card className="p-8 border-card-border bg-card/40">
        <h3 className="text-lg font-bold text-white mb-3">About the Course & Project Objectives</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">
          This project represents the culmination of a 6-month intensive curriculum exploring EVM mechanics, decentralized storage protocols, cryptographic primitives, and enterprise DApp deployment.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-4 border-t border-card-border">
          <div>
            <span className="text-gray-500 block">Course Duration:</span>
            <span className="text-white font-semibold">6 Months</span>
          </div>
          <div>
            <span className="text-gray-500 block">Target EVM:</span>
            <span className="text-white font-semibold">Paris / Cancun</span>
          </div>
          <div>
            <span className="text-gray-500 block">Solidity Version:</span>
            <span className="text-white font-semibold">0.8.24</span>
          </div>
          <div>
            <span className="text-gray-500 block">Testing Tool:</span>
            <span className="text-white font-semibold">Hardhat + Chai</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
