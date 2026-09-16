# ChainCert — Live Demonstration Guide for Instructors & Evaluators

**Target Evaluation:** Blockchain / Web3 Final Capstone Defense  
**Engineering Team:** Khaleeq ur Rahman & Shahab  
**Active Demonstration Network:** Local Hardhat EVM Node (`http://127.0.0.1:8545`, Chain ID: `31337`)  
**Smart Contract Address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`  

---

## 1. Prerequisites

Before starting the live demonstration, ensure you have:
- **Node.js**: `v20.x` or higher installed
- **npm**: `v10.x` or higher installed
- **Browser**: Google Chrome, Brave, or Firefox with **MetaMask** installed
- **Git clone**: Verified that all dependencies are installed (`npm install`)

---

## 2. Demonstration Accounts & Private Keys

The local Hardhat node provides 20 pre-funded test accounts (10,000 ETH each). Import these two accounts into MetaMask for the demonstration:

| Account Role | Public Address | Private Key (Import into MetaMask) | Role on Chain |
|---|---|---|---|
| **Platform Administrator** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` | `DEFAULT_ADMIN_ROLE` (Can authorize/deactivate universities) |
| **Accredited University Issuer** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` | `ISSUER_ROLE` (Can issue and revoke certificates) |
| **Student Recipient** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | *(No wallet needed to view; or Account #2)* | Certificate Holder (Owns credentials in vault) |

> ⚠️ **CAUTION:** These keys are well-known public test keys for local development only. Never use them on Ethereum Mainnet with real funds.

---

## 3. Network Configuration in MetaMask

1. Open **MetaMask** $\rightarrow$ Click network dropdown $\rightarrow$ **Add a network manually**.
2. Fill in the network parameters:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Click **Save** and switch to `Hardhat Localhost`.

---

## 4. Startup Commands (3 Easy Terminals)

### Terminal 1: Start the Local Blockchain Node
```bash
cd "contracts"
npx hardhat node
```
*Expected:* Mined local node starts on `http://127.0.0.1:8545` displaying 20 funded test accounts.

### Terminal 2: Verify Deployment & Seed Initial Credentials
```bash
cd "contracts"
# Deploy contract
npx hardhat run scripts/deploy.ts --network localhost

# Seed demonstration certificates (CC-2026-000001, CC-2026-000002, CC-2026-000003)
npx hardhat run scripts/test-interactions.ts --network localhost
```

### Terminal 3: Start the Next.js Frontend
```bash
cd "apps/web"
npm run dev
```
*Expected:* Ready in ~1.5s on **[http://localhost:3000](http://localhost:3000)**.

---

## 5. The Exact 17-Step Live Demonstration Script

Follow this step-by-step sequence during your instructor presentation:

### Step 1: Open the Application
- Open **`http://localhost:3000`** in Google Chrome.
- **Explain:** Point out the clean institutional aesthetic, the project tagline (*"Verify Credentials. Trust the Blockchain."*), and the engineering team credits (**Khaleeq ur Rahman & Shahab**).

### Step 2: Connect the Admin Wallet
- In MetaMask, switch to **Account #0** (`0xf39F...`).
- Click **Connect Wallet** in the top navigation bar.
- **Explain:** The connected address displays with an emerald status indicator and network badge (`Hardhat Localhost`).

### Step 3: Show Authorized Issuer Management (Admin Dashboard)
- Navigate to **`http://localhost:3000/admin`** (or click *Admin* in navbar).
- **Explain:** The admin portal strictly enforces `DEFAULT_ADMIN_ROLE` on the smart contract. Show the roster of authorized universities (e.g., *Cambridge Web3 Academy*).
- Click **Authorize Institution**, enter a new university address and name, and click *Authorize Issuer*. Approve the MetaMask transaction.

### Step 4: Connect the University Issuer Wallet
- In MetaMask, switch to **Account #1** (`0x7099...`).
- Navigate to **`http://localhost:3000/issuer`**.
- **Explain:** The issuer dashboard updates dynamically, showing live telemetry counters (`totalCertificates`, `activeCertificates`, `revokedCertificates`) read directly from `ChainCert.sol`.

### Step 5: Issue a Real Certificate
- Click **Issue Certificate** (or navigate to `/issuer/issue`).
- Fill in the form:
  - **Certificate ID**: Generates a standard ID (e.g. `CC-2026-XXXXXX`).
  - **Recipient Name**: `Sarah Jenkins`
  - **Recipient Wallet Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  - **Certificate Title**: `Certified Blockchain Architect`
  - **Course / Program**: `Advanced Web3 & Distributed Consensus`
  - **Grade / Honors**: `Distinction (98%)`
- Click **Continue to Preview**. Show the rendered vector diploma with embedded vector QR code and computed Keccak-256 fingerprint.

### Step 6 & 7: Show Wallet Signature & Blockchain Confirmation
- Click **Confirm & Issue on Blockchain**.
- **Point out the Transaction Modal:**
  - *Phase 1:* Shows plain-English educational explanation: *"Awaiting Wallet Signature: Your cryptographic signature confirms you authorize this on-chain action without exposing your private key."*
  - *Phase 2:* Click **Confirm** in MetaMask. The modal transitions to *"Awaiting Blockchain Confirmation: Network validators are packaging your transaction into a verified block."*
  - *Phase 3:* The modal turns emerald: *"Transaction Confirmed on Blockchain!"* with the transaction hash and block explorer link.

### Step 8 & 9: Show Generated Certificate PDF & QR Code
- Click **Download PDF Certificate**. Open the PDF and show the official institutional styling, seal, signature lines, and embedded QR code.
- Explain that the QR code points to `http://localhost:3000/verify/[CertificateID]`.

### Step 10 & 11: Zero-Wallet Public Verification
- Open an **Incognito / Private Window** (or a separate browser without MetaMask).
- Navigate to **`http://localhost:3000/verify`**.
- Enter your newly issued Certificate ID and click **Verify Now**.
- **Show the Instructor:**
  - The page loads without any wallet connection.
  - The primary status banner displays: **`VERIFIED & AUTHENTIC`**.
  - Review the *Academic Evaluator’s Guide* card on the right column explaining why this proves mathematical immutability and on-chain role authenticity.

### Step 12: Show Document Integrity & Cryptographic Tamper Test
- Scroll down to the **Document Cryptographic Integrity** card.
- Show that the retrieved document hash matches the on-chain hash (`MATCH - Authentic`).
- Click **"Simulate Tamper"**.
- **Observe:** The calculated hash instantly changes, and the indicator flips to rose: **`MISMATCH (TAMPER DETECTED)`**.
- **Explain:** This proves that even if someone edits a single letter of their grade in Photoshop or PDF editor, the cryptographic checksum fails.

### Step 13 & 14: Student Credential Vault
- Navigate to **`http://localhost:3000/student`**.
- Connect Account #2 (`0x3C44...`) or observe the sample recipient view.
- Show that the issued certificate appears in the student's portfolio.
- Click **Share Public Profile** $\rightarrow$ open the public student profile route `/profile/0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`.
- Explain that students can link this directly on resumes or LinkedIn profiles.

### Step 15: Revoke the Certificate on Blockchain
- Switch back to the Issuer wallet (Account #1, `0x7099...`) on `/issuer`.
- Find the newly issued certificate in the table and click **Revoke**.
- In the confirmation dialog, enter the audit reason:  
  *"Accreditation annulled due to academic integrity committee finding."*
- Click **Sign Revocation in MetaMask** and approve the transaction.
- Show the transaction confirmation modal.

### Step 16 & 17: Re-Verify the Same QR / Certificate ID
- Return to your Incognito window on the public verification page `/verify/[CertificateID]` and refresh the page.
- **Show the Final Result:**
  - The status has permanently changed to **`REVOKED BY ISSUER`**.
  - The exact on-chain audit reason and revocation timestamp are displayed.
  - The original certificate can never be edited or reinstated.

---

## 6. Expected Results Summary

| Action | Target Route | Expected Outcome |
|---|---|---|
| Admin Authorization | `/admin` | Authorizes university address with `ISSUER_ROLE`. |
| Certificate Issuance | `/issuer/issue` | Mined in block; PDF downloaded with vector QR code. |
| Zero-Wallet Verify | `/verify/[id]` | **`VERIFIED & AUTHENTIC`** with byte-for-byte hash match. |
| Tamper Simulation | `/verify/[id]` | **`MISMATCH (TAMPER DETECTED)`** triggered by 1-byte alteration. |
| On-Chain Revocation | `/issuer` | Stored on-chain with documented audit reason. |
| Public Re-Verification | `/verify/[id]` | **`REVOKED BY ISSUER`** with timestamp and reason displayed. |

---

## 7. Troubleshooting Guide

- **MetaMask says "Nonce too high" or transaction hangs:**  
  *Fix:* In MetaMask, go to **Settings $\rightarrow$ Advanced $\rightarrow$ Clear activity tab data**. This resets MetaMask's internal nonce cache to match the local node.
- **Contract call reverts with `AccessControlUnauthorizedAccount`:**  
  *Fix:* Make sure you are using Account #1 (`0x7099...`) to issue/revoke, or Account #0 (`0xf39F...`) to administrate.
- **Certificate shows "NOT FOUND":**  
  *Fix:* Verify that the local Hardhat node wasn't restarted. If restarted, re-run `npx hardhat run scripts/test-interactions.ts --network localhost`.
