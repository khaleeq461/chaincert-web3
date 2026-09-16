import React from 'react';
import { CheckCircle2, AlertOctagon, Clock, ShieldCheck } from 'lucide-react';
import { StatusType } from '../ui/StatusBadge';
import { formatDate } from '@chaincert/shared';

interface AuditTimelineProps {
  issuedAt: number | bigint;
  expiresAt: number | bigint;
  revoked: boolean;
  revokedAt?: number | bigint;
  revocationReason?: string;
  status: StatusType;
}

export function AuditTimeline({
  issuedAt,
  expiresAt,
  revoked,
  revokedAt,
  revocationReason,
  status,
}: AuditTimelineProps) {
  return (
    <div className="rounded-xl bg-black/40 border border-card-border p-5">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-brand-400" />
        On-Chain Audit Timeline
      </h4>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-card-border">
        {/* Step 1: Issuance */}
        <div className="relative">
          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Certificate Issued on Blockchain</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{formatDate(issuedAt)}</div>
            <p className="text-[11px] text-gray-500 mt-1">
              Cryptographic hash recorded in smart contract storage. Content pinned to decentralized IPFS.
            </p>
          </div>
        </div>

        {/* Step 2: Current Status */}
        {revoked ? (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-2.5 h-2.5 text-rose-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-400">Certificate Revoked on Blockchain</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {revokedAt ? formatDate(revokedAt) : 'Revoked'}
              </div>
              {revocationReason && (
                <div className="text-xs text-rose-300/90 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg mt-2">
                  <span className="font-medium">Reason: </span>
                  {revocationReason}
                </div>
              )}
            </div>
          </div>
        ) : status === 'EXPIRED' ? (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
              <Clock className="w-2.5 h-2.5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-400">Certificate Expired</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{formatDate(expiresAt)}</div>
              <p className="text-[11px] text-gray-500 mt-1">
                Validity window elapsed based on on-chain timestamp evaluation.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-400">Authentic & Active</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {Number(expiresAt) === 0 ? 'Lifetime Validity (No Expiration)' : `Valid until ${formatDate(expiresAt)}`}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Active on EVM smart contract registry. Integrity verified against IPFS payload hash.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
