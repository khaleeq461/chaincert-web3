import React, { useState } from 'react';
import Link from 'next/link';
import { Award, Calendar, ExternalLink, User, Download, Share2, Eye, Check, BookOpen } from 'lucide-react';
import { StatusBadge, StatusType } from '../ui/StatusBadge';
import { Card } from '../ui/Card';
import { formatDate } from '@chaincert/shared';

interface CertificateCardProps {
  id: string;
  title: string;
  program?: string;
  recipientName: string;
  institution: string;
  issueDate: number | bigint;
  status: StatusType;
  grade?: string;
  showActions?: boolean;
  onDownload?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function CertificateCard({
  id,
  title,
  program,
  recipientName,
  institution,
  issueDate,
  status,
  grade,
  showActions = true,
  onDownload,
  onShare,
}: CertificateCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShareClick = () => {
    if (onShare) {
      onShare(id);
    } else if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/verify/${id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card hover className="flex flex-col justify-between h-full border-card-border bg-card/60">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="font-mono text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 font-semibold">
            {id}
          </span>
          <StatusBadge status={status} size="sm" />
        </div>

        <h4 className="text-base font-bold text-white mb-1 line-clamp-1">{title}</h4>
        
        {program && (
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1.5 truncate">
            <BookOpen className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="truncate">{program}</span>
          </div>
        )}

        <div className="text-xs text-brand-300 font-medium mb-4 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="truncate">{institution}</span>
        </div>

        <div className="space-y-2 border-t border-card-border pt-3 text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-500">
              <User className="w-3.5 h-3.5" />
              Recipient:
            </span>
            <span className="text-gray-200 font-medium truncate max-w-[160px]">{recipientName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              Issued:
            </span>
            <span className="text-gray-300 font-mono text-[11px]">{formatDate(issueDate)}</span>
          </div>

          {grade && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Honors:</span>
              <span className="text-emerald-400 font-medium">{grade}</span>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="pt-4 mt-4 border-t border-card-border space-y-2">
          {/* Primary View / Verify buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/certificates/${id}`}
              className="inline-flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </Link>

            <Link
              href={`/verify/${id}`}
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Verify
            </Link>
          </div>

          {/* Secondary Download / Share buttons */}
          <div className="grid grid-cols-2 gap-2">
            {onDownload ? (
              <button
                onClick={() => onDownload(id)}
                className="inline-flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2 rounded-xl bg-black/40 hover:bg-white/5 text-gray-300 border border-card-border transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                Download
              </button>
            ) : (
              <Link
                href={`/verify/${id}`}
                className="inline-flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2 rounded-xl bg-black/40 hover:bg-white/5 text-gray-300 border border-card-border transition"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                Download
              </Link>
            )}

            <button
              onClick={handleShareClick}
              className="inline-flex items-center justify-center gap-1 text-xs font-medium py-1.5 px-2 rounded-xl bg-black/40 hover:bg-white/5 text-gray-300 border border-card-border transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-gray-400" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
