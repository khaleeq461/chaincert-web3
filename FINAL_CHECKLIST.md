# ChainCert — Final Presentation Checklist

**Project Defense:** Blockchain / Web3 Final Capstone Evaluation  
**Engineering Team:** Khaleeq ur Rahman & Shahab  

Use this checklist before and during your live presentation to verify that all systems, smart contracts, wallets, and demonstration workflows are primed and functional.

---

## 1. Pre-Presentation Technical Environment Checklist

- [x] **Local Blockchain Daemon Running:** Hardhat node running on `http://127.0.0.1:8545` (`Chain ID: 31337`).
- [x] **Smart Contract Deployed:** Bytecode verified at `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
- [x] **Sample Demonstration Credentials Seeded:**
  - `CC-2026-000001` (Active / Verified)
  - `CC-2026-000002` (Revoked on Blockchain)
  - `CC-2026-000003` (Expired Validity Window)
- [x] **MetaMask Accounts Imported:**
  - Account #0 (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) imported as **Admin**.
  - Account #1 (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`) imported as **University Issuer**.
- [x] **MetaMask Network Configured:** `Hardhat Localhost` connected with RPC `http://127.0.0.1:8545` and Chain ID `31337`.
- [x] **Activity Data Cleared:** MetaMask internal nonce cache cleared via *Settings $\rightarrow$ Advanced $\rightarrow$ Clear activity tab data*.
- [x] **Frontend Server Active:** Next.js development server running on `http://localhost:3000`.
- [x] **Incognito / Private Window Ready:** Second browser window opened without MetaMask to demonstrate zero-wallet public verification.

---

## 2. Code Quality & Security Verification Gates

- [x] **Strict TypeScript Monorepo Typecheck:** `npm run typecheck` passes with **0 errors**.
- [x] **ESLint Code Quality Gate:** `npm run lint` passes with **0 warnings and 0 errors**.
- [x] **Production Next.js Build:** `npm run build --workspace=apps/web` compiles all 14 routes cleanly.
- [x] **Smart Contract Unit Test Suite:** `npx hardhat test` passes **39 / 39 unit tests**.
- [x] **Security Audit Suite:** `npx hardhat run scripts/test-security-audit.ts --network localhost` passes all 7 security vectors.
- [x] **End-to-End Live Workflow Test:** `npx hardhat run scripts/test-final-live-demo-run.ts --network localhost` passes 100%.

---

## 3. Live Demonstration Sequence Checklist

| Step | Target Screen | Action / Feature Highlighted | Tested & Verified |
|:---:|---|---|:---:|
| **1** | Landing (`/`) | Highlight academic aesthetic, tagline, and project team credits (Khaleeq ur Rahman & Shahab). | ✅ |
| **2** | Navbar | Connect Admin wallet (Account #0); show connected address and network pill (`Hardhat Localhost`). | ✅ |
| **3** | Admin Portal (`/admin`) | Show university accreditation roster; demonstrate RBAC enforcement and issuer authorization. | ✅ |
| **4** | Issuer Portal (`/issuer`) | Switch to Issuer wallet (Account #1); show live telemetry counters (`totalCertificates`, etc.). | ✅ |
| **5** | Issue Form (`/issuer/issue`) | Fill issuance form; show URL-safe ID validation and 0x address format validation. | ✅ |
| **6** | Diploma Preview | Preview diploma with embedded vector QR code and Keccak-256 cryptographic digest. | ✅ |
| **7** | Transaction Modal | Show educational plain-English modal: *Awaiting Wallet Signature* $\rightarrow$ *Mined in Block*. | ✅ |
| **8** | Download PDF | Click *Download PDF*; open high-fidelity certificate with seal and embedded QR code. | ✅ |
| **9** | Public Verification (`/verify`) | Switch to Incognito window (no wallet); enter ID or test quick-links. | ✅ |
| **10** | Verify Result (`/verify/[id]`) | Confirm **`VERIFIED & AUTHENTIC`** status banner and Academic Evaluator’s Guide. | ✅ |
| **11** | Cryptographic Integrity Tool | Scroll to Document Integrity card; show hash MATCH. | ✅ |
| **12** | Tamper Simulation | Click *Simulate Tamper*; observe instant flip to **`MISMATCH (TAMPER DETECTED)`**. | ✅ |
| **13** | Student Vault (`/student`) | View credentials in student portfolio; demonstrate shareable link `/profile/0x...`. | ✅ |
| **14** | On-Chain Revocation (`/issuer`) | Return to Issuer wallet; click *Revoke*; provide audit reason; sign transaction in MetaMask. | ✅ |
| **15** | Public Re-Verification | Refresh public verify page in Incognito window; confirm permanent status: **`REVOKED BY ISSUER`**. | ✅ |
| **16** | Anti-Tamper Permanence | Explain that the revoked certificate cannot be reused, edited, or re-verified. | ✅ |

---

## 4. Key Talking Points for Evaluator Questions

1. **"Why not store the entire PDF on the Ethereum blockchain?"**  
   *Answer:* Storing 1 MB of binary data on Ethereum costs thousands of dollars in gas. ChainCert implements the dual-layer architecture: only a 32-byte cryptographic digest (`bytes32`) is committed on-chain, while the document resides on decentralized, content-addressed IPFS.
2. **"Can a student tamper with their grades in the downloaded PDF?"**  
   *Answer:* No. If a single byte is altered in the PDF, its computed hash changes completely. The verification portal recalculates the hash and flags an immediate `MISMATCH`.
3. **"Can an unauthorized institution issue fake certificates?"**  
   *Answer:* No. `ChainCert.sol` enforces OpenZeppelin `AccessControl`. The function `issueCertificate` strictly requires `ISSUER_ROLE`. Any transaction from an unauthorized wallet is rejected at the EVM bytecode level.
4. **"Does an employer need cryptocurrency or MetaMask to verify credentials?"**  
   *Answer:* No. Verification queries are read-only calls executed over public JSON-RPC directly to the smart contract. Employers verify credentials completely free in milliseconds without touching crypto.
