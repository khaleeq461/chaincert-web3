import { createPublicClient, http } from 'viem';
import { hardhat, sepolia } from 'viem/chains';

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
const isSepolia = process.env.NEXT_PUBLIC_CHAIN_ID === '11155111';

export const publicClient = createPublicClient({
  chain: isSepolia ? sepolia : hardhat,
  transport: http(rpcUrl),
});
