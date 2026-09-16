export interface NetworkConfig {
  chainId: number;
  name: string;
  currency: string;
  rpcUrl: string;
  explorerUrl?: string;
  isTestnet: boolean;
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  31337: {
    chainId: 31337,
    name: 'Hardhat Localhost',
    currency: 'ETH',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: 'http://localhost:8545',
    isTestnet: true,
  },
  11155111: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    currency: 'SepoliaETH',
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    currency: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    isTestnet: true,
  },
  80002: {
    chainId: 80002,
    name: 'Polygon Amoy',
    currency: 'POL',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    isTestnet: true,
  },
};

export const DEFAULT_CHAIN_ID = 31337;
