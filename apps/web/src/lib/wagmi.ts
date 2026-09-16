import { http, createConfig } from 'wagmi';
import { hardhat, sepolia, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const isSepolia = process.env.NEXT_PUBLIC_CHAIN_ID === '11155111' || process.env.NODE_ENV === 'production';

export const config = createConfig({
  chains: isSepolia ? [sepolia, hardhat, baseSepolia] : [hardhat, sepolia, baseSepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org'),
    [hardhat.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
