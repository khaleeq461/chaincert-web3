'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CHAINCERT_CONTRACT_ADDRESS, CHAINCERT_ABI } from '@/lib/contract';
import type { Address } from 'viem';

export function useIssueCertificate() {
  const { data: hash, isPending, writeContractAsync, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const issue = async (args: {
    certificateId: string;
    recipient: Address;
    metadataURI: string;
    certificateHash: `0x${string}`;
    expiresAt: bigint;
  }) => {
    return await writeContractAsync({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'issueCertificate',
      args: [
        args.certificateId,
        args.recipient,
        args.metadataURI,
        args.certificateHash,
        args.expiresAt,
      ],
    });
  };

  return {
    issue,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: !!error,
    error,
    receipt,
    reset,
  };
}

export function useRevokeCertificate() {
  const { data: hash, isPending, writeContractAsync, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const revoke = async (args: {
    certificateId: string;
    reason: string;
  }) => {
    return await writeContractAsync({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'revokeCertificate',
      args: [args.certificateId, args.reason],
    });
  };

  return {
    revoke,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: !!error,
    error,
    receipt,
    reset,
  };
}

export function useAuthorizeIssuer() {
  const { data: hash, isPending, writeContractAsync, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const authorize = async (args: {
    issuer: Address;
    institutionName: string;
  }) => {
    return await writeContractAsync({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'authorizeIssuer',
      args: [args.issuer, args.institutionName],
    });
  };

  return {
    authorize,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: !!error,
    error,
    receipt,
    reset,
  };
}

export function useDeactivateIssuer() {
  const { data: hash, isPending, writeContractAsync, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const deactivate = async (args: { issuer: Address }) => {
    return await writeContractAsync({
      address: CHAINCERT_CONTRACT_ADDRESS,
      abi: CHAINCERT_ABI,
      functionName: 'deactivateIssuer',
      args: [args.issuer],
    });
  };

  return {
    deactivate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: !!error,
    error,
    receipt,
    reset,
  };
}
