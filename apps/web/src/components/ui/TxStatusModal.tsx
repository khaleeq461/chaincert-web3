'use client';

import React from 'react';
import { ExternalLink, CheckCircle2, AlertOctagon, Loader2, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { formatAddress } from '@chaincert/shared';

interface TxStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending?: boolean; // Waiting for user to sign in MetaMask
  isConfirming?: boolean; // Waiting for block confirmation
  isSuccess?: boolean; // Mined on-chain
  isError?: boolean;
  error?: Error | null;
  txHash?: `0x${string}` | string;
  title?: string;
  successMessage?: string;
}

export function TxStatusModal({
  isOpen,
  onClose,
  isPending,
  isConfirming,
  isSuccess,
  isError,
  error,
  txHash,
  title = 'Blockchain Transaction',
  successMessage = 'Transaction confirmed successfully on the blockchain.',
}: TxStatusModalProps) {
  const explorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'http://localhost:8545';

  // Extract clean readable error
  const getErrorMessage = () => {
    if (!error) return 'Transaction was rejected or encountered an EVM revert.';
    const msg = error.message || String(error);
    if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('rejected the request')) {
      return 'Signature request was rejected in your wallet.';
    }
    if (msg.includes('CertificateAlreadyExists')) {
      return 'A certificate with this ID already exists on the blockchain.';
    }
    if (msg.includes('UnauthorizedRevocation')) {
      return 'You do not have permission to revoke this certificate.';
    }
    if (msg.includes('IssuerAlreadyAuthorized')) {
      return 'This institution address is already authorized.';
    }
    if (msg.includes('AccessControlUnauthorizedAccount')) {
      return 'Your connected wallet does not hold the required smart contract role.';
    }
    return msg.slice(0, 180) + (msg.length > 180 ? '...' : '');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="py-4 text-center">
        {/* State 1: Waiting for wallet signature */}
        {isPending && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <div className="inline-block mb-2">
                <StatusBadge status="PENDING" size="sm" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Awaiting Wallet Signature</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Please review and approve the transaction in your browser wallet (e.g., MetaMask). Your cryptographic signature confirms you authorize this on-chain action without exposing your private key.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 text-left space-y-1">
              <div className="font-semibold text-gray-300">What happens next?</div>
              <div>1. You approve in your wallet window.</div>
              <div>2. The transaction is broadcast to the peer-to-peer blockchain network.</div>
              <div>3. Validators include it in a verified block.</div>
            </div>
          </div>
        )}

        {/* State 2: Mining block */}
        {isConfirming && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <div className="inline-block mb-2">
                <StatusBadge status="PENDING" size="sm" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Awaiting Blockchain Confirmation</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Your transaction is broadcast to the blockchain mempool. Network validators are now packaging it into a block to make the record mathematically immutable.
              </p>
            </div>
            {txHash && (
              <div className="p-3 rounded-xl bg-black/40 border border-card-border text-xs font-mono text-left space-y-1">
                <span className="text-gray-500 block">Blockchain Identifier (Transaction Hash):</span>
                <span className="text-brand-300 break-all">{txHash}</span>
              </div>
            )}
          </div>
        )}

        {/* State 3: Confirmed */}
        {isSuccess && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-block mb-2">
                <StatusBadge status="VERIFIED" size="sm" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Transaction Confirmed on Blockchain!</h4>
              <p className="text-xs text-emerald-300/90 leading-relaxed max-w-sm mx-auto">{successMessage}</p>
            </div>

            {txHash && (
              <div className="p-3 rounded-xl bg-black/40 border border-card-border text-xs font-mono text-left space-y-2">
                <div>
                  <span className="text-gray-500 block mb-1">Transaction Hash:</span>
                  <span className="text-brand-300 break-all">{txHash}</span>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-gray-400 text-[11px]">Network: EVM Blockchain</span>
                  {explorerUrl && (
                    <a
                      href={`${explorerUrl}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 text-[11px]"
                    >
                      View on Explorer
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <Button size="sm" onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        )}

        {/* State 4: Error / Rejection */}
        {isError && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">Transaction Not Completed</h4>
              <p className="text-xs text-rose-300/90 leading-relaxed bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-left font-sans">
                {getErrorMessage()}
              </p>
              <p className="text-[11px] text-gray-400 mt-2 text-left">
                Note: When a transaction is rejected or reverts, no state changes are saved to the blockchain.
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={onClose} className="w-full">
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
