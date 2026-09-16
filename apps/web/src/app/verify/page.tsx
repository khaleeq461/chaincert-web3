'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ShieldCheck, QrCode, ArrowRight, CheckCircle2, AlertOctagon, Clock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function VerifySearchPage() {
  const router = useRouter();
  const [certId, setCertId] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = certId.trim();
    if (!cleanId) {
      setError('Please enter a valid Certificate ID');
      return;
    }
    setError('');
    router.push(`/verify/${encodeURIComponent(cleanId)}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-medium mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Zero-Wallet Public Verification
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Verify Academic Credentials
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Verify digital degrees and professional certifications directly against the blockchain registry.
          No crypto wallet or account required.
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-8 mb-8 border-brand-500/30 shadow-2xl shadow-brand-500/5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={certId}
              onChange={(e) => {
                setCertId(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter Certificate ID (e.g. CC-2026-000001)"
              className="w-full rounded-xl bg-black/50 border border-card-border pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
          <Button type="submit" size="md" className="shrink-0 px-6 py-3">
            Verify Now
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {error && <div className="text-xs text-rose-400 mt-2">{error}</div>}

        <div className="mt-6 pt-6 border-t border-card-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <span className="text-gray-400">Quick Test Credentials (Demonstration):</span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/verify/CC-2026-000001"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition font-mono"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              CC-2026-000001 (Verified)
            </Link>
            <Link
              href="/verify/CC-2026-000002"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition font-mono"
            >
              <AlertOctagon className="w-3 h-3 text-rose-400" />
              CC-2026-000002 (Revoked)
            </Link>
            <Link
              href="/verify/CC-2026-000003"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition font-mono"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              CC-2026-000003 (Expired)
            </Link>
            <Link
              href="/verify/CC-NONEXISTENT-999"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-500/10 text-gray-300 border border-gray-500/20 hover:bg-gray-500/20 transition font-mono"
            >
              <HelpCircle className="w-3 h-3 text-gray-400" />
              CC-NONEXISTENT-999 (Not Found)
            </Link>
          </div>
        </div>
      </Card>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-card-border bg-card/40">
          <QrCode className="w-6 h-6 text-brand-400 mb-3" />
          <h4 className="text-sm font-semibold text-white mb-1.5">Scanning a Certificate QR Code?</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Paper and PDF certificates generated through ChainCert include a vector QR code.
            Scanning the QR code using any smartphone camera automatically opens this public verification portal with live on-chain results.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-card-border bg-card/40">
          <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
          <h4 className="text-sm font-semibold text-white mb-1.5">How Is Authenticity Guaranteed?</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            The verification engine matches the SHA-256 cryptographic hash of the certificate against the immutable record published on Ethereum smart contracts by the accredited university.
          </p>
        </div>
      </div>
    </div>
  );
}
