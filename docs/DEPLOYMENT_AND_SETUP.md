# ChainCert — Setup, Deployment & Operations Manual

This guide provides step-by-step instructions for running ChainCert from a clean clone on a local machine or deploying to an Ethereum testnet (Sepolia).

---

## 1. Prerequisites

Ensure your development environment meets the following requirements:
- **Node.js**: `v20.x` or higher (LTS recommended)
- **npm**: `v10.x` or higher
- **Git**: Installed and configured
- **Web3 Wallet**: MetaMask or any browser extension supporting injected EVM wallets
- **Operating System**: Windows, macOS, or Linux

---

## 2. Step-by-Step Clean Clone Setup

### Step 2.1: Clone the Repository & Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd "ChainCert Web 3 project"

# Install all workspace dependencies across the monorepo
npm install
```

### Step 2.2: Configure Environment Variables
Copy the root `.env.example` to `.env` in the project root and `.env.local` in `apps/web`:

```bash
# Copy root environment file
cp .env.example .env

# Copy web frontend environment file
cp apps/web/.env.example apps/web/.env.local
```

#### Default Local Configuration (`apps/web/.env.local`)
```env
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_BLOCK_EXPLORER_URL=http://localhost:8545
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_PROVIDER=mock
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

---

## 3. Running Locally (Local EVM Hardhat Node)

### Step 3.1: Start the Local Hardhat Node
In your primary terminal:
```bash
cd contracts
npx hardhat node
```
*Leave this terminal running.* The local node will start on `http://127.0.0.1:8545` (Chain ID `31337`) and provide 20 test accounts pre-funded with 10,000 ETH each:
- **Account #0** (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`): Platform Administrator
- **Account #1** (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`): Authorized University Issuer
- **Account #2** (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`): Student Recipient

### Step 3.2: Deploy the Smart Contract to Local Node
In a second terminal:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```
You will receive:
```
ChainCert contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Admin address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### Step 3.3: Seed Initial Demonstration Certificates (Optional)
To seed initial demonstration certificates (`CC-2026-000001`, `CC-2026-000002`, `CC-2026-000003`):
```bash
cd contracts
npx hardhat run scripts/test-interactions.ts --network localhost
```

### Step 3.4: Configure MetaMask for Localhost
1. Open MetaMask $\rightarrow$ Click Network Dropdown $\rightarrow$ **Add a network manually**.
2. **Network Name**: `Hardhat Localhost`
3. **New RPC URL**: `http://127.0.0.1:8545`
4. **Chain ID**: `31337`
5. **Currency Symbol**: `ETH`
6. Import Account #0 private key (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`) to act as Admin.
7. Import Account #1 private key (`0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`) to act as Issuer.

### Step 3.5: Launch the Next.js Frontend
In your third terminal:
```bash
cd apps/web
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 4. Running Verification Test Suites

### Unit Tests (Hardhat)
```bash
cd contracts
npx hardhat test
```
*Expected: 39 passing tests.*

### Security Audit Suite
```bash
cd contracts
npx hardhat run scripts/test-security-audit.ts --network localhost
```
*Expected: All 7 security test vectors passing (100%).*

### Complete 20-Point Lifecycle Test Pass
```bash
cd contracts
npx hardhat run scripts/test-complete-lifecycle-pass.ts --network localhost
```
*Expected: All 16 automated lifecycle paths passing.*

### Monorepo Typecheck & Production Build
```bash
# In the project root
npm run typecheck
npm run lint
npm run build --workspace=apps/web
```

---

## 5. Ethereum Sepolia Testnet Deployment

To deploy to public Ethereum Sepolia:

### Step 5.1: Acquire Sepolia ETH
Obtain testnet ETH from a Sepolia faucet (e.g. Google Cloud Web3 Faucet, Alchemy Faucet, or Infura Faucet) to fund your deployer wallet.

### Step 5.2: Update Contract `.env`
In `contracts/.env`:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

### Step 5.3: Deploy to Sepolia
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```
Save the newly deployed contract address (e.g. `0x1234...`).

### Step 5.4: Verify Contract on Etherscan
```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS> <ADMIN_WALLET_ADDRESS>
```

### Step 5.5: Switch Frontend to Sepolia
In `apps/web/.env.local`:
```env
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_CONTRACT_ADDRESS=<DEPLOYED_CONTRACT_ADDRESS>
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io
```

---

## 6. Configuring Production IPFS (Pinata)

For offline development, ChainCert uses `mock-adapter.ts` which computes authentic cryptographic CIDs and hashes without external network calls.

To enable live production IPFS via Pinata:
1. Sign up at [Pinata.cloud](https://pinata.cloud).
2. Generate an API Key with `pinFileToIPFS` and `pinJSONToIPFS` permissions.
3. Update `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_STORAGE_PROVIDER=pinata
   PINATA_JWT=your_pinata_jwt_token_here
   NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
   ```
4. Restart the Next.js server (`npm run dev`).

---

## 7. Troubleshooting & Common Issues

| Issue | Root Cause | Solution |
|---|---|---|
| **MetaMask: Nonce too high / transaction stuck** | Local Hardhat node was restarted while MetaMask cached old nonces. | In MetaMask: Settings $\rightarrow$ Advanced $\rightarrow$ **Clear activity tab data**. |
| **Contract Call Revert: `AccessControlUnauthorizedAccount`** | Connected wallet does not hold `ISSUER_ROLE` or `DEFAULT_ADMIN_ROLE`. | Connect Account #0 (`0xf39F...`) to admin portal to authorize your current address. |
| **Public verify page shows "NOT FOUND"** | Certificate ID was typed incorrectly or smart contract was redeployed to a new address without re-seeding. | Run `npx hardhat run scripts/test-interactions.ts --network localhost` to re-seed sample IDs. |
| **Wrong Network Alert in UI** | MetaMask is connected to Ethereum Mainnet or an unsupported testnet. | Click "Switch to Localhost" or "Switch to Sepolia" in the navigation bar. |
