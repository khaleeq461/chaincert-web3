'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import {
  Award,
  PlusCircle,
  Search,
  AlertOctagon,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  Filter,
  Wallet,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Share2,
  Check,
  Copy,
  GraduationCap,
  ShieldAlert,
  ArrowUpRight,
  FileText
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, StatusType } from '@/components/ui/StatusBadge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { TxStatusModal } from '@/components/ui/TxStatusModal';
import { useRevokeCertificate } from '@/hooks/useChainCert';
import {
  fetchPlatformStats,
  fetchAllCertificateIds,
  fetchCertificate,
  fetchCertificateValidity,
  fetchInstitutionName,
  checkIsIssuer,
  checkIsAdmin,
  OnChainCertData,
  CHAINCERT_CONTRACT_ADDRESS
} from '@/lib/contract';
import { formatDate, formatAddress } from '@chaincert/shared';
import type { Address } from 'viem';

interface IssuerCertItem {
  certificateId: string;
  recipientAddress: string;
  recipientName: string;
  issuerAddress: string;
  institutionName: string;
  title: string;
  course: string;
  issuedAt: number;
  expiresAt: number;
  status: StatusType;
  revoked: boolean;
  revocationReason: string;
  txHash: string;
}

export default function IssuerDashboard() {
  const { address, isConnected } = useAccount();
  const { revoke, hash, isPending, isConfirming, isSuccess, isError, error, reset } = useRevokeCertificate();

  const [isIssuer, setIsIssuer] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState<boolean>(true);
  const [myInstitutionName, setMyInstitutionName] = useState<string>('Accredited Educational Institution');

  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'MY_CERTS' | 'ALL'>('MY_CERTS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'REVOKED' | 'EXPIRED'>('ALL');
  
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<IssuerCertItem | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isLoadingCerts, setIsLoadingCerts] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalCertificates: 0,
    totalIssuers: 0,
    activeCertificates: 0,
    revokedCertificates: 0,
  });

  const [certList, setCertList] = useState<IssuerCertItem[]>([]);

  // Verify Issuer & Admin Roles on Blockchain
  useEffect(() => {
    async function verifyRoles() {
      setIsCheckingRoles(true);
      if (isConnected && address) {
        const [issuerRole, adminRole, instName] = await Promise.all([
          checkIsIssuer(address as Address),
          checkIsAdmin(address as Address),
          fetchInstitutionName(address as Address),
        ]);
        setIsIssuer(issuerRole);
        setIsAdmin(adminRole);
        if (instName) setMyInstitutionName(instName);
      } else {
        setIsIssuer(false);
        setIsAdmin(false);
      }
      setIsCheckingRoles(false);
    }
    verifyRoles();
  }, [address, isConnected]);

  // Load On-Chain Certificates & Telemetry
  const loadOnChainDashboard = useCallback(async () => {
    setIsLoadingCerts(true);
    try {
      // 1. Fetch telemetry
      const statsData = await fetchPlatformStats();
      setStats(statsData);

      // 2. Fetch on-chain certificate IDs
      const allIds = await fetchAllCertificateIds();

      if (allIds && allIds.length > 0) {
        const loaded = await Promise.all(
          allIds.map(async (id) => {
            const [onChain, validity] = await Promise.all([
              fetchCertificate(id),
              fetchCertificateValidity(id),
            ]);

            if (!onChain) return null;

            // Fetch institution name from contract
            let instName = 'Authorized Web3 Institution';
            if (onChain.issuer) {
              const name = await fetchInstitutionName(onChain.issuer);
              if (name) instName = name;
            }

            // Fetch off-chain metadata if present
            let recipientName = 'Verified Student';
            let title = 'Blockchain Credential';
            let course = 'Web3 Engineering';

            if (onChain.metadataURI) {
              try {
                const cid = onChain.metadataURI.replace(/^ipfs:\/\//, '');
                const metaRes = await fetch(`/api/ipfs/${cid}`);
                if (metaRes.ok) {
                  const metaJson = await metaRes.json();
                  if (metaJson.recipient?.name) recipientName = metaJson.recipient.name;
                  if (metaJson.credential?.title) title = metaJson.credential.title;
                  if (metaJson.credential?.course) course = metaJson.credential.course;
                }
              } catch {
                // Keep defaults
              }
            }

            const statusMap: Record<number, StatusType> = {
              0: 'NOT_FOUND',
              1: 'VERIFIED',
              2: 'REVOKED',
              3: 'EXPIRED',
            };

            const computedStatus = statusMap[validity.status] || (onChain.revoked ? 'REVOKED' : 'VERIFIED');

            return {
              certificateId: onChain.certificateId,
              recipientAddress: onChain.recipient,
              recipientName,
              issuerAddress: onChain.issuer,
              institutionName: instName,
              title,
              course,
              issuedAt: Number(onChain.issuedAt),
              expiresAt: Number(onChain.expiresAt),
              status: computedStatus,
              revoked: onChain.revoked,
              revocationReason: onChain.revocationReason,
              txHash: onChain.certificateHash,
            };
          })
        );

        setCertList(loaded.filter(Boolean) as IssuerCertItem[]);
      } else {
        setCertList([]);
      }
    } catch (err) {
      console.error('Failed to load on-chain issuer dashboard:', err);
    } finally {
      setIsLoadingCerts(false);
    }
  }, []);

  useEffect(() => {
    loadOnChainDashboard();
  }, [loadOnChainDashboard]);

  // Refetch when revocation transaction confirms
  useEffect(() => {
    if (isSuccess) {
      loadOnChainDashboard();
    }
  }, [isSuccess, loadOnChainDashboard]);

  // Filtering
  const filteredCerts = certList.filter((c) => {
    // Scope filter (My certs vs All network)
    if (scopeFilter === 'MY_CERTS' && address) {
      if (c.issuerAddress.toLowerCase() !== address.toLowerCase()) {
        return false;
      }
    }

    const matchesSearch =
      c.certificateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recipientAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenRevoke = (cert: IssuerCertItem) => {
    setSelectedCert(cert);
    setRevocationReason('');
    setReasonError('');
    setRevokeModalOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!revocationReason.trim()) {
      setReasonError('A documented audit reason is required for on-chain revocation.');
      return;
    }
    if (!selectedCert) return;

    setRevokeModalOpen(false);
    setTxModalOpen(true);

    try {
      await revoke({
        certificateId: selectedCert.certificateId,
        reason: revocationReason.trim(),
      });
    } catch (err) {
      console.error('Revocation execution error:', err);
    }
  };

  const handleShareLink = (certId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/verify/${certId}`;
      navigator.clipboard.writeText(url);
      setCopiedId(certId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const myIssuedCount = address
    ? certList.filter((c) => c.issuerAddress.toLowerCase() === address.toLowerCase()).length
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-400 mb-1">
            <Award className="w-4 h-4" />
            <span>Institution Issuer Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isIssuer ? myInstitutionName : 'Credential Issuance & Lifecycle'}
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-mono flex items-center gap-2">
            Active Wallet: <span className="text-white">{address ? formatAddress(address, 6) : 'Not Connected'}</span>
            {isIssuer && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Authorized Issuer
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOnChainDashboard}
            disabled={isLoadingCerts}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCerts ? 'animate-spin' : ''}`} />
            Sync Blockchain
          </Button>

          <Link href="/issuer/issue">
            <Button size="sm" className="gap-2" disabled={!isIssuer && !isAdmin}>
              <PlusCircle className="w-4 h-4" />
              Issue New Certificate
            </Button>
          </Link>
        </div>
      </div>

      {/* Permission & Authorization Banners */}
      {!isConnected ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Connect your authorized institution wallet with MetaMask to sign certificate issuances and on-chain revocations.
            </span>
          </div>
        </div>
      ) : isCheckingRoles ? (
        <div className="p-4 rounded-xl bg-card border border-card-border text-xs text-gray-400 flex items-center gap-2.5 mb-8">
          <Loader2 className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
          <span>Checking ISSUER_ROLE permissions on ChainCert smart contract...</span>
        </div>
      ) : !isIssuer && !isAdmin ? (
        <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 mb-8">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div className="font-semibold text-white text-sm">
                Your wallet is connected, but it is not authorized as an issuer.
              </div>
              <p className="text-amber-300/90 leading-relaxed">
                Address <code className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">{address}</code> does not hold the cryptographic <code className="font-mono text-white">ISSUER_ROLE</code> on the ChainCert smart contract. Only authorized educational institutions can issue or revoke credentials.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link href="/student">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Go to Student Credential Vault
                  </Button>
                </Link>
                <Link href="/verify">
                  <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
                    Search Public Verification Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Connected as authorized issuer: <strong className="text-white">{myInstitutionName}</strong> (<code className="font-mono">{address ? formatAddress(address, 4) : ''}</code>).

            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">ISSUER_ROLE ACTIVE</span>
        </div>
      )}

      {/* Metric Cards (Live On-Chain Telemetry) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">My Issued Credentials</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{myIssuedCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Bound to your issuer address</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Platform Total</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-brand-400">{stats.totalCertificates}</div>
          <p className="text-[11px] text-gray-500 mt-1">Across all registered institutions</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active & Valid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{stats.activeCertificates}</div>
          <p className="text-[11px] text-gray-500 mt-1">Passing blockchain verification</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Revoked Credentials</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{stats.revokedCertificates}</div>
          <p className="text-[11px] text-gray-500 mt-1">With on-chain audit trail</p>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Institutional Certificate Registry</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Authoritative smart contract records anchored to Ethereum block state.
            </p>
          </div>

          {/* Filters & Scope */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scope Toggle */}
            <div className="inline-flex rounded-lg border border-card-border p-0.5 bg-black/40 text-xs">
              <button
                onClick={() => setScopeFilter('MY_CERTS')}
                className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                  scopeFilter === 'MY_CERTS'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                My Issued ({myIssuedCount})
              </button>
              <button
                onClick={() => setScopeFilter('ALL')}
                className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                  scopeFilter === 'ALL'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Network ({certList.length})
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-card border border-card-border rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Active & Valid</option>
              <option value="REVOKED">Revoked</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, student, program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-card border border-card-border text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {isLoadingCerts ? (
          <div className="py-20 text-center text-xs text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" />
            Loading live certificate records from Ethereum smart contract...
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            <Award className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="font-semibold text-white mb-1">No Certificates Found</p>
            <p className="text-gray-500">
              {scopeFilter === 'MY_CERTS'
                ? 'Your connected wallet has not issued any certificates yet.'
                : 'No certificates match the selected filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Certificate ID</TableHeader>
                  <TableHeader>Recipient & Program</TableHeader>
                  <TableHeader>Issuing Institution</TableHeader>
                  <TableHeader>Issued Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="text-right">Actions & Proofs</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCerts.map((cert) => {
                  const isMyCert = address && cert.issuerAddress.toLowerCase() === address.toLowerCase();
                  const canRevoke = (isAdmin || isMyCert) && !cert.revoked;

                  return (
                    <TableRow key={cert.certificateId}>
                      <TableCell className="font-mono text-xs font-semibold text-brand-300">
                        <div className="flex items-center gap-1.5">
                          <span>{cert.certificateId}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium text-white">{cert.recipientName}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px]">{cert.course}</div>
                        <div className="text-[10px] font-mono text-gray-500">
                          {formatAddress(cert.recipientAddress, 4)}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <span className="text-gray-200 block">{cert.institutionName}</span>
                        <span className="text-[10px] font-mono text-gray-500">
                          {formatAddress(cert.issuerAddress, 4)}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-gray-400 font-mono text-[11px]">
                        {formatDate(cert.issuedAt)}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <StatusBadge status={cert.status} size="sm" />
                          {cert.revoked && cert.revocationReason && (
                            <p className="text-[10px] text-rose-300/80 max-w-[150px] truncate" title={cert.revocationReason}>
                              {cert.revocationReason}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Share Verification Link */}
                          <button
                            onClick={() => handleShareLink(cert.certificateId)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
                            title="Copy Public Verification Link"
                          >
                            {copiedId === cert.certificateId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>

                          {/* View Detail Link */}
                          <Link
                            href={`/certificates/${cert.certificateId}`}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
                            title="View Certificate Details & QR"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Revoke Action */}
                          {canRevoke && (
                            <button
                              onClick={() => handleOpenRevoke(cert)}
                              className="text-xs px-2 py-1 rounded-md transition text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 font-medium cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Revocation Confirmation Modal */}
      <Modal
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        title="Revoke Certificate On-Chain"
        description="Permanently invalidates the selected certificate on the blockchain registry."
      >
        {selectedCert && (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-rose-200">Irreversible Blockchain Action</span>
                <p className="text-[11px] leading-relaxed text-rose-300/90">
                  Revocation is permanently recorded on the Ethereum blockchain. This credential will immediately fail public verification and cannot be un-revoked.
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-card p-4 rounded-xl border border-card-border text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Certificate ID:</span>
                <span className="font-mono text-white font-semibold">{selectedCert.certificateId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recipient:</span>
                <span className="text-white">{selectedCert.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Program:</span>
                <span className="text-white">{selectedCert.course}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-200 mb-1.5 block">
                On-Chain Audit Reason <span className="text-rose-400">*</span>
              </label>
              <Textarea
                placeholder="e.g. Academic Integrity Audit: Coursework verification discrepancy found."
                value={revocationReason}
                onChange={(e) => {
                  setRevocationReason(e.target.value);
                  if (reasonError) setReasonError('');
                }}
                rows={3}
              />
              {reasonError && <p className="text-xs text-rose-400 mt-1">{reasonError}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-card-border">
              <Button variant="ghost" size="sm" onClick={() => setRevokeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmRevoke}>
                Sign Revocation in MetaMask
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaction Status Modal */}
      <TxStatusModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        isPending={isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        isError={isError}
        error={error}
        txHash={hash}
        title="Revoking Certificate On-Chain"
        successMessage={`Certificate ${selectedCert?.certificateId} was revoked on-chain successfully.`}
      />
    </div>
  );
}
