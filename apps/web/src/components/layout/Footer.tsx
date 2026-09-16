import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ExternalLink, Code2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-card-border bg-black/40 text-gray-400 text-xs py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand info */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">ChainCert</span>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed max-w-md mb-4">
            A production-grade decentralized certificate issuance and instant verification platform.
            Ensuring cryptographic authenticity, tamper-evident metadata on IPFS, and immutable status on EVM smart contracts.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Hardhat Localhost (31337) / Sepolia Testnet (11155111)</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Protocol</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/verify" className="hover:text-white transition">Verify Certificate</Link>
            </li>
            <li>
              <Link href="/issuer" className="hover:text-white transition">Issuer Dashboard</Link>
            </li>
            <li>
              <Link href="/student" className="hover:text-white transition">Student Credential Vault</Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-white transition">Admin Portal</Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-white transition">Architecture & How it Works</Link>
            </li>
          </ul>
        </div>

        {/* Capstone Team */}
        <div>
          <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Engineering Team</h4>
          <div className="space-y-2.5">
            <div>
              <div className="text-white font-medium">Khaleeq ur Rahman</div>
              <div className="text-[11px] text-gray-500">Web3 / Blockchain Engineer</div>
            </div>
            <div>
              <div className="text-white font-medium">Shahab</div>
              <div className="text-[11px] text-gray-500">Web3 / Blockchain Engineer</div>
            </div>
            <div className="pt-2">
              <Link href="/team" className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-medium">
                View Capstone Profile
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-card-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
        <div>
          &copy; {new Date().getFullYear()} ChainCert. Built for 6-Month Blockchain/Web3 Course Final Capstone.
        </div>
        <div className="flex items-center gap-4">
          <Link href="/docs" className="hover:text-gray-300 transition">Smart Contract Spec</Link>
          <span>•</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition inline-flex items-center gap-1"
          >
            <Code2 className="w-3.5 h-3.5" />
            Source Repository
          </a>
        </div>
      </div>
    </footer>
  );
}
