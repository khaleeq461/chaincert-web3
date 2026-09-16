# Decentralized Document-Storage & Cryptographic Integrity Architecture

**Project:** ChainCert — Blockchain-Based Certificate Verification Platform  
**Authors:** Khaleeq ur Rahman & Shahab  

---

## 1. Architectural Separation: On-Chain vs. Off-Chain

To prevent bloat, preserve privacy, and maintain high performance, ChainCert strictly decouples **authoritative state** from **unstructured content**:

| Layer | Storage Medium | Stored Attributes | Security Guarantee |
|---|---|---|---|
| **Authoritative State** | Ethereum EVM Smart Contract (`ChainCert.sol`) | • Unique Certificate ID<br>• Issuing Institution Address<br>• Recipient Wallet Address<br>• Cryptographic Document Hash (`bytes32`)<br>• Content Identifier / Metadata URI (`string`)<br>• Issuance Timestamp (`uint64`)<br>• Expiration Timestamp (`uint64`)<br>• Revocation State & Audit Reason | Immutable, decentralized consensus, unalterable once mined, strict role-based access control. |
| **Decentralized Storage** | IPFS (InterPlanetary File System) via Pinata | • Official Certificate PDF Diploma<br>• Canonical Credential Metadata JSON<br>• Competency Descriptions & Honors | Content-addressed storage (CIDv1), decentralized distribution, high availability. |

> [!IMPORTANT]
> **Privacy & Security Protection:**  
> Sensitive personal information (e.g. personal email addresses, student grades, full diploma binaries, or private keys) is **NEVER** placed on the public blockchain. The blockchain holds only the mathematical hash fingerprint (`keccak256`) and the content-addressed pointer (`ipfs://...`).

---

## 2. Cryptographic Integrity Verification: Zero Trust Principle

### Why IPFS Links Alone Are Insufficient
Anyone can pin a counterfeit document to IPFS and generate a valid CID. Therefore:

$$\text{Authenticity} \neq \text{Existence of an IPFS Link}$$

ChainCert implements true zero-trust cryptographic verification:
1. When a certificate is issued, a deterministic Keccak-256 hash is generated from the canonical content.
2. This hash is permanently anchored to the Ethereum smart contract via `issueCertificate()`.
3. When verifying, the frontend downloads the document, computes its live cryptographic digest, and compares it byte-for-byte against the smart contract record:
   - **MATCH**: The document is 100% authentic and unaltered.
   - **MISMATCH**: If even a single byte, punctuation mark, or character in the PDF or metadata has been tampered with, the resulting hash completely changes, instantly triggering an on-chain tamper alert.

---

## 3. How to Configure the Real IPFS Provider (Pinata)

ChainCert includes a clean storage abstraction (`IStorageService`) supporting both production IPFS providers and local development adapters.

### Option A: Real IPFS via Pinata (Recommended for Production)

1. **Sign Up for Pinata**:
   Visit [https://pinata.cloud](https://pinata.cloud) and create a free developer account (includes 1GB storage and 500 pinned files).

2. **Generate an API Key**:
   - In the Pinata dashboard, navigate to **"API Keys"** in the left sidebar.
   - Click **"New Key"**.
   - Enable the following permissions:
     - `pinFileToIPFS` (Files -> Write)
     - `pinJSONToIPFS` (Pinning -> Write)
   - Set a descriptive Key Name (e.g. `ChainCert-DApp`).
   - Click **"Generate API Key"**.

3. **Copy the JWT (JSON Web Token)**:
   - Copy the long `JWT` string provided in the modal.

4. **Update Environment Variables**:
   In your root `.env` or `apps/web/.env.local`:
   ```env
   # Pinata JWT Token
   PINATA_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

   # Dedicated or Public Gateway
   NEXT_PUBLIC_IPFS_GATEWAY="https://gateway.pinata.cloud/ipfs/"
   ```

5. **Restart the Next.js Server**:
   ```bash
   npm run dev --workspace=apps/web
   ```
   All newly issued certificates and synthesized PDF diplomas will now be automatically pinned directly to the global IPFS swarm!

---

### Option B: Built-in Local Development Adapter (Default Fallback)

If `PINATA_JWT` is left empty, ChainCert automatically switches to `LocalMockStorageAdapter`:
- Computes standard IPFS CIDv1 multihashes (`bafkrei...`) using local cryptographic sha256.
- Serves pinned JSON metadata and PDF binaries directly via `/api/ipfs/[cid]`.
- Requires **zero external accounts**, **zero API keys**, and functions seamlessly in offline environments.

---

## 4. Testing Document Tamper Detection in the UI

1. Open any certificate verification route: `http://localhost:3000/verify/CC-2026-000001`.
2. Scroll to the **"Cryptographic Document Integrity Verification"** card.
3. Observe the authoritative on-chain blockchain fingerprint (e.g. `0xc07170aa44c585...`).
4. Click **"Verify Live IPFS Content"**:
   - The UI pulls the document directly from decentralized storage, hashes the content in the browser, and renders:
   ```
   [MATCH (INTEGRITY CONFIRMED)]
   Cryptographic Document Integrity Verified.
   Calculated digest matches the smart contract fingerprint byte-for-byte.
   ```
5. Click **"Simulate Tamper"**:
   - The UI flips a single bit in the document bytes and recomputes the Keccak-256 hash.
   - Observe the instant reaction:
   ```
   [MISMATCH (TAMPER DETECTED)]
   Cryptographic Fingerprint Mismatch.
   Calculated hash does not correspond to the on-chain blockchain record!
   ```
