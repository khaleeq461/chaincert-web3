'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import {
  Settings,
  ShieldCheck,
  Award,
  PlusCircle,
  AlertOctagon,
  Users,
  CheckCircle2,
  Lock,
  Database,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Clock,
  FileCheck2,
  AlertTriangle,
  Info,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { TxStatusModal } from '@/components/ui/TxStatusModal';
import { StatusBadge, StatusType } from '@/components/ui/StatusBadge';
import { useAuthorizeIssuer, useDeactivateIssuer } from '@/hooks/useChainCert';
import {
  fetchPlatformStats,
  fetchAllIssuers,
  fetchInstitutionName,
  checkIsAdmin,
  checkIsIssuer,
  fetchAllCertificateIds,
  fetchCertificate,
  fetchCertificateValidity,
  CHAINCERT_CONTRACT_ADDRESS,
  DEFAULT_ADMIN_ROLE
} from '@/lib/contract';
import { formatAddress, formatDate } from '@chaincert/shared';
import { isAddress, type Address } from 'viem';

interface IssuerRecord {
  address: Address;
  name: string;
  isAuthorized: boolean;
}

interface CertActivityRecord {
  id: string;
  recipient: string;
  issuer: string;
  institutionName: string;
  issuedAt: number;
  status: StatusType;
  txHash: string;
}

export default function AdminDashboardPage() {
  const { address, isConnected } = useAccount();

  const {
    authorize,
    hash: authHash,
    isPending: authPending,
    isConfirming: authConfirming,
    isSuccess: authSuccess,
    isError: authError,
    error: authErr,
  } = useAuthorizeIssuer();

  const {
    deactivate,
    hash: deactHash,
    isPending: deactPending,
    isConfirming: deactConfirming,
    isSuccess: deactSuccess,
    isError: deactError,
    error: deactErr,
  } = useDeactivateIssuer();

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingRole, setIsCheckingRole] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ISSUERS' | 'ACTIVITY' | 'NETWORK'>('ISSUERS');

  const [issuers, setIssuers] = useState<IssuerRecord[]>([]);
  const [activities, setActivities] = useState<CertActivityRecord[]>([]);
  const [isLoadingIssuers, setIsLoadingIssuers] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txModalProps, setTxModalProps] = useState({
    title: 'Smart Contract Execution',
    successMessage: 'Action confirmed on-chain.',
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    isError: false,
    error: null as Error | null,
    hash: undefined as `0x${string}` | undefined,
  });

  const [newIssuerAddress, setNewIssuerAddress] = useState('');
  const [newInstitutionName, setNewInstitutionName] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedContract, setCopiedContract] = useState(false);

  const [stats, setStats] = useState({
    totalCertificates: 0,
    totalIssuers: 0,
    activeCertificates: 0,
    revokedCertificates: 0,
  });

  // Verify Admin Role on Blockchain
  useEffect(() => {
    async function verifyAdminRole() {
      setIsCheckingRole(true);
      if (isConnected && address) {
        const adminStatus = await checkIsAdmin(address as Address);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setIsCheckingRole(false);
    }
    verifyAdminRole();
  }, [address, isConnected]);

  // Load Platform Stats & Issuers
  const loadAdminData = useCallback(async () => {
    setIsLoadingIssuers(true);
    try {
      const statsData = await fetchPlatformStats();
      setStats(statsData);

      const addresses = await fetchAllIssuers();
      if (addresses && addresses.length > 0) {
        const issuerDetails = await Promise.all(
          addresses.map(async (addr) => {
            const [name, isAuth] = await Promise.all([
              fetchInstitutionName(addr),
              checkIsIssuer(addr),
            ]);
            return {
              address: addr,
              name: name || 'Authorized Educational Institution',
              isAuthorized: isAuth,
            };
          })
        );
        setIssuers(issuerDetails);
      } else {
        setIssuers([]);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoadingIssuers(false);
    }
  }, []);

  // Load Certificate Activity
  const loadActivityData = useCallback(async () => {
    setIsLoadingActivity(true);
    try {
      const allIds = await fetchAllCertificateIds();
      if (allIds && allIds.length > 0) {
        const certRecords = await Promise.all(
          allIds.slice(-15).reverse().map(async (id) => {
            const [cert, validity] = await Promise.all([
              fetchCertificate(id),
              fetchCertificateValidity(id),
            ]);
            if (!cert) return null;

            let instName = 'Authorized Web3 Institution';
            if (cert.issuer) {
              const name = await fetchInstitutionName(cert.issuer);
              if (name) instName = name;
            }

            const statusMap: Record<number, StatusType> = {
              0: 'NOT_FOUND',
              1: 'VERIFIED',
              2: 'REVOKED',
              3: 'EXPIRED',
            };

            const computedStatus = statusMap[validity.status] || (cert.revoked ? 'REVOKED' : 'VERIFIED');

            return {
              id: cert.certificateId,
              recipient: cert.recipient,
              issuer: cert.issuer,
              institutionName: instName,
              issuedAt: Number(cert.issuedAt),
              status: computedStatus,
              txHash: cert.certificateHash,
            };
          })
        );
        setActivities(certRecords.filter(Boolean) as CertActivityRecord[]);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Failed to load certificate activity:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
    loadActivityData();
  }, [loadAdminData, loadActivityData, authSuccess, deactSuccess]);

  // Sync auth modal feedback
  useEffect(() => {
    if (authPending || authConfirming || authSuccess || authError) {
      setTxModalProps({
        title: 'Authorizing Institution On-Chain',
        successMessage: `Granted ISSUER_ROLE to ${newIssuerAddress} successfully!`,
        isPending: authPending,
        isConfirming: authConfirming,
        isSuccess: authSuccess,
        isError: authError,
        error: authErr,
        hash: authHash,
      });
      setTxModalOpen(true);
      if (authSuccess) {
        setNewIssuerAddress('');
        setNewInstitutionName('');
      }
    }
  }, [authPending, authConfirming, authSuccess, authError, authErr, authHash, newIssuerAddress]);

  // Sync deact modal feedback
  useEffect(() => {
    if (deactPending || deactConfirming || deactSuccess || deactError) {
      setTxModalProps({
        title: 'Deactivating Institution On-Chain',
        successMessage: 'Revoked ISSUER_ROLE permissions on smart contract.',
        isPending: deactPending,
        isConfirming: deactConfirming,
        isSuccess: deactSuccess,
        isError: deactError,
        error: deactErr,
        hash: deactHash,
      });
      setTxModalOpen(true);
    }
  }, [deactPending, deactConfirming, deactSuccess, deactError, deactErr, deactHash]);

  const handleAuthorizeIssuer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddress(newIssuerAddress.trim())) {
      setFormError('Valid 42-character Ethereum address (0x...) is required.');
      return;
    }
    if (!newInstitutionName.trim()) {
      setFormError('Institution name is required.');
      return;
    }

    setFormError('');
    setAuthModalOpen(false);

    try {
      await authorize({
        issuer: newIssuerAddress.trim() as Address,
        institutionName: newInstitutionName.trim(),
      });
    } catch (err) {
      console.error('Authorization call failed:', err);
    }
  };

  const handleDeactivate = async (addr: Address) => {
    if (!isAdmin) return;
    try {
      await deactivate({ issuer: addr });
    } catch (err) {
      console.error('Deactivation call failed:', err);
    }
  };

  const handleReauthorize = (issuer: IssuerRecord) => {
    setNewIssuerAddress(issuer.address);
    setNewInstitutionName(issuer.name);
    setAuthModalOpen(true);
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(CHAINCERT_CONTRACT_ADDRESS);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-400 mb-1">
            <Settings className="w-4 h-4" />
            <span>Platform Governance & Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            ChainCert Protocol Admin
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-mono flex items-center gap-2">
            Target Contract: <span className="text-white">{formatAddress(CHAINCERT_CONTRACT_ADDRESS, 6)}</span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Admin Role Verified
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadAdminData();
              loadActivityData();
            }}
            disabled={isLoadingIssuers || isLoadingActivity}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIssuers || isLoadingActivity ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setNewIssuerAddress('');
              setNewInstitutionName('');
              setAuthModalOpen(true);
            }}
            disabled={!isAdmin}
            className="gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Authorize New Institution
          </Button>
        </div>
      </div>

      {/* Permission Feedback Banners */}
      {!isConnected ? (
        <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 flex items-center gap-3 mb-8">
          <Lock className="w-4 h-4 text-brand-400 shrink-0" />
          <span>
            Connect your administrator wallet (MetaMask) to execute governance actions (authorizing or deactivating educational institutions). Displaying on-chain telemetry in read-only mode.
          </span>
        </div>
      ) : isCheckingRole ? (
        <div className="p-4 rounded-xl bg-card border border-card-border text-xs text-gray-400 flex items-center gap-2.5 mb-8">
          <Loader2 className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
          <span>Verifying DEFAULT_ADMIN_ROLE permissions on Ethereum smart contract...</span>
        </div>
      ) : !isAdmin ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3 mb-8">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-white">
              Your wallet is connected, but it does not have administrator privileges.
            </div>
            <p className="text-amber-300/90 leading-relaxed">
              Address <code className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">{address}</code> does not hold the <code className="font-mono text-white">DEFAULT_ADMIN_ROLE</code> on the ChainCert smart contract. Admin actions (authorizing/deactivating issuers) are locked and will be rejected by smart contract access control.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Connected as authorized protocol administrator (<code className="font-mono font-semibold text-white">{address ? formatAddress(address, 6) : ''}</code>). Full governance rights active.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">OpenZeppelin RBAC</span>
        </div>
      )}

      {/* Platform Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Institutions</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalIssuers}</div>
          <p className="text-[11px] text-gray-500 mt-1">Authorized on smart contract</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Platform Certificates</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-brand-400">{stats.totalCertificates}</div>
          <p className="text-[11px] text-gray-500 mt-1">Minted on EVM blockchain</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active & Valid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{stats.activeCertificates}</div>
          <p className="text-[11px] text-gray-500 mt-1">Passing verification</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Revoked Credentials</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{stats.revokedCertificates}</div>
          <p className="text-[11px] text-gray-500 mt-1">With on-chain audit reason</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-card-border mb-6">
        <button
          onClick={() => setActiveTab('ISSUERS')}
          className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ISSUERS'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Authorized Institutions ({issuers.length})
        </button>

        <button
          onClick={() => setActiveTab('ACTIVITY')}
          className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ACTIVITY'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Certificate Activity ({activities.length})
        </button>

        <button
          onClick={() => setActiveTab('NETWORK')}
          className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'NETWORK'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Contract & Network Information
        </button>
      </div>

      {/* TAB 1: AUTHORIZED ISSUERS */}
      {activeTab === 'ISSUERS' && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Registered Educational Issuers</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Institutions possessing the cryptographic <code className="font-mono text-brand-300">ISSUER_ROLE</code> on the ChainCert contract.
              </p>
            </div>

            {isAdmin && (
              <Button size="sm" onClick={() => setAuthModalOpen(true)} className="gap-1.5 self-start">
                <PlusCircle className="w-3.5 h-3.5" />
                Authorize Institution
              </Button>
            )}
          </div>

          {isLoadingIssuers ? (
            <div className="py-16 text-center text-xs text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" />
              Loading authorized institutions from smart contract...
            </div>
          ) : issuers.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No educational institutions registered on-chain yet.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Institution Name</TableHeader>
                  <TableHeader>Issuer Wallet Address</TableHeader>
                  <TableHeader>On-Chain Status</TableHeader>
                  <TableHeader className="text-right">Governance Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {issuers.map((issuer) => (
                  <TableRow key={issuer.address}>
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-brand-400 shrink-0" />
                        <span>{issuer.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <span>{issuer.address}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {issuer.isAuthorized ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Active Issuer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">
                          <AlertOctagon className="w-3 h-3" />
                          Deactivated
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {issuer.isAuthorized ? (
                        <button
                          onClick={() => handleDeactivate(issuer.address)}
                          disabled={!isAdmin}
                          className="text-xs px-2.5 py-1 rounded transition text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title={!isAdmin ? 'Admin permissions required' : 'Deactivate issuer privileges'}
                        >
                          Deactivate Issuer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReauthorize(issuer)}
                          disabled={!isAdmin}
                          className="text-xs px-2.5 py-1 rounded transition text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title={!isAdmin ? 'Admin permissions required' : 'Re-authorize issuer privileges'}
                        >
                          Re-authorize
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB 2: CERTIFICATE ACTIVITY */}
      {activeTab === 'ACTIVITY' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Platform Certificate Activity</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Real-time stream of academic credentials registered on the ChainCert registry.
              </p>
            </div>
          </div>

          {isLoadingActivity ? (
            <div className="py-16 text-center text-xs text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" />
              Retrieving certificate activity from blockchain...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No certificate activity recorded yet.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Certificate ID</TableHeader>
                  <TableHeader>Institution</TableHeader>
                  <TableHeader>Recipient Wallet</TableHeader>
                  <TableHeader>Issued Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="text-right">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell className="font-mono text-xs font-semibold text-brand-300">
                      {act.id}
                    </TableCell>

                    <TableCell className="text-xs text-white">
                      {act.institutionName}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-gray-400">
                      {formatAddress(act.recipient, 4)}
                    </TableCell>

                    <TableCell className="text-xs text-gray-400">
                      {formatDate(act.issuedAt)}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={act.status} size="sm" />
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      <Link
                        href={`/certificates/${act.id}`}
                        className="text-xs text-gray-300 hover:text-white underline underline-offset-2"
                      >
                        View
                      </Link>
                      <Link
                        href={`/verify/${act.id}`}
                        className="text-xs text-brand-400 hover:text-brand-300 underline underline-offset-2"
                      >
                        Verify
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB 3: CONTRACT & NETWORK INFO */}
      {activeTab === 'NETWORK' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-400" />
              Smart Contract Architecture
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block mb-1">Contract Address:</span>
                <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-lg border border-card-border font-mono text-white text-[11px] break-all">
                  <span>{CHAINCERT_CONTRACT_ADDRESS}</span>
                  <button
                    onClick={handleCopyContract}
                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition shrink-0 ml-auto cursor-pointer"
                    title="Copy Contract Address"
                  >
                    {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block mb-1">Role-Based Access Control:</span>
                <div className="bg-black/40 p-2.5 rounded-lg border border-card-border font-mono text-gray-300 text-[11px] space-y-1">
                  <div>DEFAULT_ADMIN_ROLE: <span className="text-brand-300">{DEFAULT_ADMIN_ROLE}</span></div>
                  <div>ISSUER_ROLE: <span className="text-brand-300">keccak256(&quot;ISSUER_ROLE&quot;)</span></div>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block mb-1">Security Standard:</span>
                <p className="text-gray-300">
                  OpenZeppelin Contracts v5.0 (AccessControl, ReentrancyGuard, ERC165)
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Network & Node Environment
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-card-border">
                <span className="text-gray-400">Target Chain:</span>
                <span className="text-white font-mono font-semibold">Hardhat Localhost (Chain ID: 31337)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-card-border">
                <span className="text-gray-400">RPC Endpoint:</span>
                <span className="text-brand-300 font-mono">http://127.0.0.1:8545</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-card-border">
                <span className="text-gray-400">Consensus & Confirmation:</span>
                <span className="text-emerald-400 font-semibold">Instant EVM Finality</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-card-border">
                <span className="text-gray-400">Zero-Wallet Public Client:</span>
                <span className="text-emerald-400 font-semibold">Enabled (viem readContract)</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Authorize Modal */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Authorize Educational Institution"
        description="Grants ISSUER_ROLE permissions on the ChainCert smart contract."
      >
        <form onSubmit={handleAuthorizeIssuer} className="space-y-4 mt-2">
          <Input
            label="Institution Legal / Display Name"
            placeholder="e.g. Stanford Web3 Research Institute"
            value={newInstitutionName}
            onChange={(e) => setNewInstitutionName(e.target.value)}
          />

          <Input
            label="Institution Wallet Address"
            placeholder="0x..."
            value={newIssuerAddress}
            onChange={(e) => setNewIssuerAddress(e.target.value)}
            className="font-mono"
            helperText="Address that will sign certificate issuance and revocation transactions."
          />

          {formError && <div className="text-xs text-rose-400">{formError}</div>}

          <div className="flex justify-end gap-3 pt-4 border-t border-card-border">
            <Button variant="ghost" size="sm" type="button" onClick={() => setAuthModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Sign Authorization in MetaMask
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <TxStatusModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        isPending={txModalProps.isPending}
        isConfirming={txModalProps.isConfirming}
        isSuccess={txModalProps.isSuccess}
        isError={txModalProps.isError}
        error={txModalProps.error}
        txHash={txModalProps.hash}
        title={txModalProps.title}
        successMessage={txModalProps.successMessage}
      />
    </div>
  );
}
