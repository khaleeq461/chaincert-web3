'use client';

import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AlertTriangle, ArrowRight, Globe } from 'lucide-react';
import { Button } from '../ui/Button';

export function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');
  const isSupported = chainId === expectedChainId || chainId === 11155111; // Hardhat or Sepolia

  if (!isConnected || isSupported) return null;

  const targetName = expectedChainId === 31337 ? 'Hardhat Localhost (31337)' : 'Ethereum Sepolia (11155111)';

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Unsupported Network Detected (Chain ID: {chainId}).</strong> Please switch to{' '}
            <strong className="text-white">{targetName}</strong> to interact with the ChainCert contract.
          </span>
        </div>

        <button
          onClick={() => switchChain?.({ chainId: (expectedChainId as 31337 | 11155111 | 84532) })}
          disabled={isPending}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          Switch to {expectedChainId === 31337 ? 'Localhost' : 'Sepolia'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
