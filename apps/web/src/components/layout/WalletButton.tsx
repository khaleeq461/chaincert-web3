'use client';

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet, LogOut, ChevronDown, Check, AlertTriangle, Copy, Globe } from 'lucide-react';
import { formatAddress } from '@chaincert/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');
  const isSupportedChain = chainId === expectedChainId || chainId === 11155111;

  const getNetworkName = (id: number) => {
    switch (id) {
      case 31337:
        return 'Hardhat Localhost';
      case 11155111:
        return 'Ethereum Sepolia';
      case 1:
        return 'Ethereum Mainnet';
      case 84532:
        return 'Base Sepolia';
      default:
        return `Chain ID ${id}`;
    }
  };

  if (!isConnected) {
    return (
      <>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          isLoading={isPending}
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </Button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Connect Web3 EVM Wallet"
          description="Select your browser wallet to interact with ChainCert smart contracts."
          maxWidth="sm"
        >
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={() => {
                const targetConnector = connectors[0] || injected();
                connect({ connector: targetConnector });
              }}
              disabled={isPending}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-card-border bg-black/30 hover:bg-brand-500/10 hover:border-brand-500/30 transition text-left cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {isPending ? 'Connecting...' : 'Browser Wallet (MetaMask)'}
                  </div>
                  <div className="text-xs text-gray-400">MetaMask, Brave, Coinbase, Rainbow</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
            </button>

            {connectError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {connectError.message.includes('rejected')
                  ? 'Connection request was cancelled in your wallet.'
                  : `Connection error: ${connectError.message}`}
              </div>
            )}

            <div className="p-3 rounded-xl bg-card border border-card-border text-[11px] text-gray-400">
              💡 Ensure your MetaMask extension is unlocked and set to <strong>Ethereum Sepolia Testnet</strong>.
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Network Badge */}
        <div
          className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium ${
            isSupportedChain
              ? 'bg-card border-card-border text-gray-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-brand-400" />
          <span>{getNetworkName(chainId)}</span>
        </div>

        {!isSupportedChain && (
          <button
            onClick={() => switchChain?.({ chainId: (expectedChainId as 31337 | 11155111 | 84532) })}
            disabled={isSwitching}
            className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Switch
          </button>
        )}

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-card border border-card-border hover:border-white/20 text-gray-200 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{formatAddress(address || '', 4)}</span>
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connected Account"
        description="Active Ethereum wallet session."
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="p-4 rounded-xl bg-black/40 border border-card-border">
            <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-white truncate max-w-[220px]">
                {address}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                title="Copy Address"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>Network</span>
            <span className="font-mono text-gray-200">{getNetworkName(chainId)} (ID: {chainId})</span>
          </div>

          {!isSupportedChain && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
              <span>Wrong network</span>
              <button
                onClick={() => switchChain?.({ chainId: (expectedChainId as 31337 | 11155111 | 84532) })}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                Switch to {expectedChainId}
              </button>
            </div>
          )}

          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              disconnect();
              setIsModalOpen(false);
            }}
          >
            <LogOut className="w-4 h-4" />
            Disconnect Wallet
          </Button>
        </div>
      </Modal>
    </>
  );
}
