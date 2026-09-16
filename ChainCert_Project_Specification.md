# ChainCert --- Blockchain-Based Certificate Verification Platform

## 1. Project Overview

**Project Name:** ChainCert\
**Project Type:** Web3 / Blockchain DApp\
**Project Goal:** Build a production-quality decentralized certificate
issuance and verification platform where authorized institutions can
issue tamper-evident digital certificates, students can own and share
their credentials, and anyone can independently verify a certificate
through its QR code and blockchain record.

**Project Team:** - Khaleeq ur Rahman - Shahab

This is a final project for a 6-month Blockchain/Web3 course. The
project should demonstrate real understanding of blockchain, smart
contracts, wallet integration, decentralized storage, cryptographic
hashing, access control, certificate lifecycle management, and modern
Web3 frontend development.

------------------------------------------------------------------------

# 2. Core Problem

Traditional academic and training certificates can be forged, edited,
duplicated, or difficult to verify. Verification often requires
contacting the issuing institution.

ChainCert solves this by creating a blockchain-backed verification
layer.

The certificate document itself should NOT be stored directly on a
public blockchain. Instead:

1.  Generate the certificate document.
2.  Store the document/metadata through decentralized storage such as
    IPFS.
3.  Calculate a cryptographic hash/fingerprint.
4.  Store the certificate ID, document hash/URI, issuer, recipient
    wallet, issue timestamp, status, and relevant metadata on the
    blockchain.
5.  Generate a QR code containing a public verification URL.
6.  Anyone can scan the QR code and independently verify the
    certificate.

------------------------------------------------------------------------

# 3. Main User Roles

## A. Platform Administrator

Responsibilities: - Manage authorized institutions/issuers. - Approve or
deactivate issuers. - View platform statistics. - Monitor certificate
activity. - Never have the ability to secretly modify an issued
certificate.

## B. Institution / Issuer

Responsibilities: - Connect wallet. - Complete institution profile. -
Create certificates. - Issue certificates to recipients. - Upload
certificate metadata/document. - Generate QR verification code. - Revoke
a certificate when legitimately required. - View certificates issued by
that institution.

## C. Student / Certificate Holder

Responsibilities: - Connect wallet. - View certificates associated with
their wallet. - View certificate details. - Download/share
certificate. - Copy verification link. - Display a public credential
profile.

## D. Public Verifier

No wallet should be required.

Anyone can: - Enter Certificate ID. - Scan QR code. - Open verification
URL. - See whether the certificate is authentic, valid, revoked, or not
found. - Compare the certificate fingerprint/hash with the blockchain
record. - See issuer and issue date. - Open the blockchain
transaction/explorer reference.

------------------------------------------------------------------------

# 4. Main Features

## Certificate Issuance

Issuer enters: - Certificate ID - Recipient name - Recipient wallet
address - Course/program name - Certificate title - Grade/score
(optional) - Issue date - Expiry date (optional) - Description -
Institution name - Certificate document/PDF - Optional recipient email

The system: - Validates data. - Uploads required content to
decentralized storage. - Generates a cryptographic hash. - Calls the
smart contract. - Waits for blockchain confirmation. - Saves the
transaction hash. - Generates a QR code. - Shows an issuance success
page.

------------------------------------------------------------------------

# 5. Certificate Lifecycle

A certificate should support:

**ISSUED → ACTIVE → REVOKED**

Optional: **ACTIVE → EXPIRED** when an expiry date exists.

Important: - Issued certificate data must not be silently editable. -
Corrections should use a new certificate/reissue flow rather than
mutating historical blockchain data. - Revocation should be recorded
on-chain. - The UI should clearly show the current status.

------------------------------------------------------------------------

# 6. Public Verification

The public verification page is the most important page.

Example URL:

`/verify/CC-2026-000001`

It should display:

-   ChainCert logo/name
-   Verification status
-   Certificate ID
-   Recipient name
-   Certificate title
-   Course/program
-   Issuing institution
-   Issue date
-   Expiry date if applicable
-   Issuer wallet address
-   Blockchain network
-   Transaction hash
-   Certificate/document fingerprint
-   IPFS/decentralized storage link when appropriate
-   Verification timestamp
-   QR/share action

Possible statuses:

### Verified

Green success state: "The certificate is authentic and currently valid."

### Revoked

Clear warning state: "This certificate was issued on the blockchain but
has been revoked by the authorized issuer."

### Expired

Clear warning: "This certificate exists but its validity period has
expired."

### Not Found

Clear error: "No certificate with this ID was found on the connected
blockchain."

Do not claim a certificate is verified based only on a centralized
database. The blockchain record must be the source of truth.

------------------------------------------------------------------------

# 7. Smart Contract Requirements

Use Solidity and OpenZeppelin where appropriate.

The contract should provide secure role-based access control.

Suggested roles: - DEFAULT_ADMIN_ROLE - ISSUER_ROLE

Core certificate structure should contain appropriate fields such as:

-   certificateId
-   recipient wallet
-   issuer wallet
-   metadata URI / content identifier
-   certificate hash
-   issuedAt
-   expiresAt
-   revoked
-   revokedAt

Core functions should include concepts such as:

-   authorizeIssuer()
-   revokeIssuer()
-   issueCertificate()
-   revokeCertificate()
-   getCertificate()
-   isCertificateValid()
-   certificateExists()

Emit events such as: - CertificateIssued - CertificateRevoked -
IssuerAuthorized - IssuerRevoked

Prevent: - duplicate certificate IDs - unauthorized issuance -
unauthorized revocation - invalid recipient addresses - invalid expiry
dates - accidental overwriting of historical certificates

Use custom errors where useful.

The smart contract should be written with security and gas efficiency in
mind.

------------------------------------------------------------------------

# 8. Blockchain Network

Use a low-cost Ethereum-compatible test network for development/demo.

Preferred approach: - Hardhat local network for development/testing. - A
public Ethereum-compatible testnet for demonstration. - Make the network
configurable through environment variables.

Do not hard-code private keys, RPC URLs, API keys, or secrets.

The application should show: - Current network - Contract address -
Explorer link - Transaction hash

------------------------------------------------------------------------

# 9. Web3 Wallet

Use MetaMask or another injected EVM wallet.

The UI should support: - Connect wallet - Disconnect wallet - Detect
wrong network - Request network switch when possible - Show shortened
wallet address - Display wallet/network state - Gracefully handle
rejected transactions - Gracefully handle insufficient gas - Wait for
transaction confirmation

Never ask users to enter or expose their private keys.

------------------------------------------------------------------------

# 10. Decentralized Storage

Prefer IPFS-compatible storage for certificate documents/metadata.

Important architecture:

**Blockchain stores proof and critical state.**

**IPFS stores larger documents/metadata.**

Do not put full PDF files directly into smart-contract storage.

Store a cryptographic fingerprint/hash so that document tampering can be
detected.

The project should make it clear that: - Blockchain = immutable
verification record - IPFS = decentralized content storage - Frontend =
user interface - Wallet = identity/signing mechanism

For local development, provide a clean mock/storage adapter if an IPFS
API key is unavailable, but the architecture must make real IPFS
integration straightforward.

------------------------------------------------------------------------

# 11. Certificate PDF

The platform should generate a professional certificate PDF.

Design should include: - ChainCert branding - Institution name/logo -
Recipient name - Certificate title - Course/program - Issue date -
Certificate ID - Authorized issuer name - QR code - Verification URL -
Blockchain/network reference where appropriate

The QR code should point to the public verification page.

Do not put sensitive personal information on the blockchain.

------------------------------------------------------------------------

# 12. Recommended Tech Stack

Frontend: - Next.js or React - TypeScript - Tailwind CSS - shadcn/ui or
an equally polished component system

Web3: - wagmi - viem - WalletConnect/injected wallet support where
appropriate - Solidity

Smart contract development: - Hardhat - OpenZeppelin Contracts -
TypeScript tests

Storage: - IPFS-compatible provider - Storage abstraction layer

Database: A lightweight database may be used for non-authoritative
application data such as: - institution profile - UI preferences -
indexing/cache - audit UI data

However, blockchain must remain the source of truth for certificate
authenticity/status.

QR: - QR code generation library

PDF: - A reliable browser/server PDF generation solution.

------------------------------------------------------------------------

# 13. UI/UX

The application must NOT look like a generic student CRUD project.

Create a polished modern Web3 SaaS/DApp interface.

Visual direction: - Professional academic/institutional identity -
Modern but trustworthy - Clean typography - Responsive design -
Excellent desktop and mobile layouts - Subtle Web3 visual elements -
Avoid excessive crypto clichés - Avoid unnecessary neon effects - Use
accessible contrast and clear status indicators

Include: - Landing page - How it works - Features - Trust/security
explanation - Public verification search - Issuer dashboard -
Certificate creation - Certificate details - Student credential
profile - Admin dashboard - Documentation/help - About/team section

Team section: **Khaleeq ur Rahman & Shahab** Blockchain/Web3 Project
Team

------------------------------------------------------------------------

# 14. Landing Page

Hero section:

**"Verify Credentials. Trust the Blockchain."**

Supporting idea: "ChainCert makes academic and professional certificates
tamper-evident and independently verifiable."

Primary actions: - Verify a Certificate - Issue a Certificate

Sections: 1. Problem 2. How ChainCert works 3. Why blockchain 4.
Features 5. Verification demo 6. Security 7. Statistics 8. Team 9.
Footer

------------------------------------------------------------------------

# 15. Issuer Dashboard

Show: - Total certificates issued - Active certificates - Revoked
certificates - Recent certificates - Wallet address - Contract/network
information

Actions: - Issue certificate - View certificates - Revoke certificate -
Search certificate - Export/share verification link

Certificate table: - ID - Recipient - Program - Issue date - Status -
Transaction - Actions

------------------------------------------------------------------------

# 16. Student Dashboard

Show: - Total credentials - Active credentials - Revoked credentials -
Recent credentials

Certificate cards should have: - Certificate title - Institution - Issue
date - Status - Verify button - Share button - Download button

Public profile option: `/profile/<wallet-address>`

Only display information intended to be public.

------------------------------------------------------------------------

# 17. Admin Dashboard

Admin should be able to: - View platform statistics - Authorize issuer
wallet - Deactivate issuer - View issuer list - View certificate
activity - View contract/network information

Admin actions must be protected by wallet-based authorization.

Do not create a fake frontend-only admin password.

------------------------------------------------------------------------

# 18. Security Requirements

Treat security as a first-class requirement.

Implement: - Role-based smart contract access control - Input
validation - Wallet address validation - Duplicate certificate
prevention - Reentrancy-safe patterns where applicable - Proper event
emission - No private keys in frontend/backend source - `.env.example` -
No secrets committed to Git - Safe transaction handling - Error
handling - Rate limiting for centralized endpoints if any - File type
and file size validation - Hash verification - XSS-safe rendering -
Avoid trusting client-supplied certificate status - Public verification
must query authoritative blockchain data

Document known limitations.

------------------------------------------------------------------------

# 19. Testing

The project should include meaningful tests.

Smart contract tests: - Admin can authorize issuer - Unauthorized user
cannot issue - Authorized issuer can issue - Duplicate ID is rejected -
Invalid recipient is rejected - Certificate retrieval works - Valid
certificate returns valid status - Issuer can revoke - Unauthorized user
cannot revoke - Revoked certificate returns invalid/revoked status -
Expiry logic works - Events are emitted

Frontend tests: - Wallet connection - Wrong network handling -
Certificate form validation - Verification states - Transaction
loading/error/success states

Integration/E2E: - Connect wallet - Issue certificate - Confirm
transaction - Retrieve certificate - Verify publicly - Revoke
certificate - Verify revoked status

------------------------------------------------------------------------

# 20. Demo Scenario

The final presentation should use this story:

### Step 1

University/institute connects its authorized wallet.

### Step 2

Issuer creates a certificate for a student.

### Step 3

The system creates the certificate PDF and QR code.

### Step 4

Certificate metadata/document is stored using IPFS.

### Step 5

The certificate hash and key metadata are recorded on the blockchain.

### Step 6

The issuer receives a blockchain transaction confirmation.

### Step 7

Student opens their credential.

### Step 8

A verifier scans the QR code.

### Step 9

The public verification page reads the blockchain record.

### Step 10

The page shows: **VERIFIED**

### Step 11

Issuer revokes the certificate.

### Step 12

Verifier scans the same QR again.

### Step 13

The result changes to: **REVOKED**

This before/after demonstration should be a major part of the final
presentation.

------------------------------------------------------------------------

# 21. Architecture

Use a modular architecture similar to:

``` text
                         ChainCert
                            |
             +--------------+--------------+
             |                             |
        Web Frontend                  Smart Contracts
       React/Next.js                    Solidity
             |                             |
        wagmi/viem                    EVM Blockchain
             |                             |
          Wallet                     Certificate State
             |
      +------+------+
      |             |
   API/DB        IPFS Storage
      |             |
   Index/cache    PDF/metadata
```

Important principle:

``` text
Blockchain = Source of Truth
Database = Supporting/Indexing Data
IPFS = Decentralized Document Storage
Wallet = User Identity + Transaction Signing
Frontend = Presentation Layer
```

------------------------------------------------------------------------

# 22. Suggested Folder Structure

``` text
chaincert/
├── apps/
│   ├── web/
│   └── api/
├── contracts/
│   ├── contracts/
│   ├── test/
│   ├── scripts/
│   └── hardhat.config.ts
├── packages/
│   ├── shared/
│   └── blockchain/
├── docs/
├── public/
├── .env.example
├── README.md
└── package.json
```

The exact structure may be adapted if a simpler monorepo provides a
better developer experience.

------------------------------------------------------------------------

# 23. Environment Variables

Use `.env.example`.

Possible variables:

``` text
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_BLOCK_EXPLORER_URL=
IPFS_API_URL=
IPFS_PROJECT_ID=
IPFS_PROJECT_SECRET=
DATABASE_URL=
```

Never commit real credentials.

------------------------------------------------------------------------

# 24. Documentation Requirements

README must explain:

1.  Project overview
2.  Problem statement
3.  Features
4.  Architecture
5.  Tech stack
6.  Smart contract design
7.  Blockchain network
8.  IPFS architecture
9.  Wallet integration
10. Installation
11. Environment variables
12. Running locally
13. Running tests
14. Deploying contracts
15. Configuring frontend
16. Demo flow
17. Security considerations
18. Known limitations
19. Team members

Also include: - architecture diagram - smart contract flow - certificate
lifecycle - screenshots after implementation - deployment information

------------------------------------------------------------------------

# 25. Academic Presentation Requirements

The project should clearly demonstrate these blockchain concepts:

-   Blockchain immutability
-   Smart contracts
-   EVM
-   Wallets
-   Public/private key concepts
-   Transaction signing
-   Gas
-   Events
-   On-chain vs off-chain data
-   IPFS
-   Cryptographic hashing
-   Role-based access control
-   Decentralized verification
-   Certificate revocation
-   Testnet deployment

Avoid pretending that everything is decentralized if some components are
centralized.

------------------------------------------------------------------------

# 26. Quality Requirements

The final result should be: - Functional - Secure by student-project
standards - Responsive - Visually polished - Well documented -
Testable - Easy to demonstrate - Easy for another developer to run -
Free of obvious placeholder content - Free of fake blockchain data -
Free of hard-coded private keys - Free of unnecessary complexity

Do not build a superficial mockup.

Build a real working DApp with real smart-contract interactions.

------------------------------------------------------------------------

# 27. Development Strategy

Implement incrementally:

### Phase 1

Project architecture and setup.

### Phase 2

Smart contract.

### Phase 3

Smart contract tests.

### Phase 4

Local blockchain deployment.

### Phase 5

Wallet connection.

### Phase 6

Frontend design/system.

### Phase 7

Certificate issuance.

### Phase 8

IPFS/document handling.

### Phase 9

Public verification.

### Phase 10

Revocation.

### Phase 11

Dashboards.

### Phase 12

Security hardening.

### Phase 13

Testing.

### Phase 14

Testnet deployment.

### Phase 15

Documentation and final demo preparation.

------------------------------------------------------------------------

# 28. Important Development Rule

Do NOT generate the entire project as one uncontrolled batch.

Work phase-by-phase.

Before implementing each major phase: - Inspect the existing code. -
Understand current architecture. - Preserve working functionality. -
Make small, testable changes. - Run appropriate tests/build/lint. - Fix
errors before moving forward. - Never overwrite working functionality
unnecessarily.

If a requirement conflicts with an existing implementation, explain the
conflict and choose the safer architecture.

------------------------------------------------------------------------

# 29. Definition of Done

ChainCert is considered complete only when:

-   [ ] Smart contract compiles
-   [ ] Smart contract tests pass
-   [ ] Contract deployed to local/test network
-   [ ] Wallet connection works
-   [ ] Issuer authorization works
-   [ ] Certificate issuance works on-chain
-   [ ] Duplicate IDs are prevented
-   [ ] Certificate retrieval works
-   [ ] QR code is generated
-   [ ] Public verification works without wallet
-   [ ] Certificate revocation works
-   [ ] Revoked certificate is clearly shown
-   [ ] Expiry handling works if enabled
-   [ ] IPFS/document storage works or has a clean development adapter
-   [ ] PDF certificate generation works
-   [ ] Issuer dashboard works
-   [ ] Student dashboard works
-   [ ] Admin functionality is properly protected
-   [ ] Responsive UI works
-   [ ] Error/loading/success states work
-   [ ] No secrets are committed
-   [ ] `.env.example` exists
-   [ ] README is complete
-   [ ] Final demo can be reproduced from a clean setup

------------------------------------------------------------------------

# 30. Team

## Khaleeq ur Rahman

Web3 / Blockchain Project Team Member

## Shahab

Web3 / Blockchain Project Team Member

Both team members should be represented professionally in the About/Team
section and project documentation.

------------------------------------------------------------------------

# Final Product Vision

ChainCert should feel like a real product rather than a classroom CRUD
application.

A visitor should immediately understand:

> "This platform lets institutions issue certificates and lets anyone
> verify them independently through blockchain."

The strongest differentiator is the complete lifecycle:

**Issue → Store Proof → Record On-Chain → Generate QR → Publicly Verify
→ Revoke → Verify Again**

That lifecycle should work end-to-end with real blockchain transactions.
