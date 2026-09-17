'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet, LogOut, ChevronDown, Check, AlertTriangle, Copy, Globe, ExternalLink } from 'lucide-react';
import { formatAddress } from '@chaincert/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noWalletModal, setNoWalletModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
  const isSupportedChain = chainId === expectedChainId || chainId === 11155111;

  const getNetworkName = (id: number) => {
    switch (id) {
      case 11155111:
        return 'Ethereum Sepolia';
      case 31337:
        return 'Hardhat Localhost';
      case 1:
        return 'Ethereum Mainnet';
      case 84532:
        return 'Base Sepolia';
      default:
        return `Chain ID ${id}`;
    }
  };

  const handleConnect = async () => {
    if (typeof window === 'undefined') return;

    let ethereum = (window as any).ethereum;
    if (!ethereum) {
      setNoWalletModal(true);
      return;
    }

    // Handle multiple wallet extensions (e.g. Phantom vs MetaMask conflict)
    if (ethereum.providers?.length) {
      const mm = ethereum.providers.find((p: any) => p.isMetaMask && !p.isPhantom);
      if (mm) ethereum = mm;
    }

    try {
      // Trigger MetaMask prompt directly
      await ethereum.request({ method: 'eth_requestAccounts' });
      const targetConnector = connectors.find((c) => c.id === 'injected') || connectors[0] || injected();
      connect({ connector: targetConnector });
    } catch (err: any) {
      console.warn('Native request error, falling back to connector:', err);
      const targetConnector = connectors.find((c) => c.id === 'injected') || connectors[0] || injected();
      connect({ connector: targetConnector });
    }
  };

  if (!mounted) {
    return (
      <Button variant="primary" size="sm" disabled>
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConnect}
          isLoading={isPending}
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </Button>

        {/* Modal shown if no Web3 wallet is installed */}
        <Modal
          isOpen={noWalletModal}
          onClose={() => setNoWalletModal(false)}
          title="MetaMask Not Detected"
          description="A Web3 browser extension is required to connect to ChainCert."
          maxWidth="sm"
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              No Ethereum wallet extension (like MetaMask) was detected in this browser. Please install MetaMask to interact with the blockchain.
            </div>

            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button variant="primary" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                Install MetaMask Extension
              </Button>
            </a>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNoWalletModal(false)}
            >
              Close
            </Button>
          </div>
        </Modal>

        {connectError && (
          <Modal
            isOpen={Boolean(connectError)}
            onClose={() => {}}
            title="Connection Notice"
            maxWidth="sm"
          >
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {connectError.message.includes('rejected')
                ? 'Connection request was cancelled in your wallet.'
                : `Notice: ${connectError.message}`}
            </div>
          </Modal>
        )}
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
            onClick={() => switchChain?.({ chainId: 11155111 })}
            disabled={isSwitching}
            className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Switch to Sepolia
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
                onClick={() => switchChain?.({ chainId: 11155111 })}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                Switch to Sepolia
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
