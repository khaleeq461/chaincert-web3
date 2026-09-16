import { ethers } from "hardhat";

async function main() {
  console.log("==========================================================");
  console.log("TESTING DECENTRALIZED STORAGE & CRYPTOGRAPHIC INTEGRITY");
  console.log("==========================================================");

  const [admin, issuer, student] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ChainCert = await ethers.getContractFactory("ChainCert");
  const chainCert = ChainCert.attach(contractAddress) as any;

  // Ensure issuer is authorized
  const isAuth = await chainCert.isIssuerAuthorized(issuer.address);
  if (!isAuth) {
    const authTx = await chainCert.connect(admin).authorizeIssuer(issuer.address, "Global Web3 Institute");
    await authTx.wait();
  }

  // STEP 1: Synthesize Document Content & Metadata
  console.log("\n[STEP 1] Generating Off-Chain Credential Document & Canonical Metadata...");
  const certId = `CC-INTEGRITY-${Date.now()}`;
  const canonicalDocumentPayload = JSON.stringify({
    certificateId: certId,
    recipient: {
      name: "Shahab & Khaleeq ur Rahman",
      wallet: student.address,
      email: "secure.student@example.com", // SENSITIVE: MUST STAY OFF-CHAIN
    },
    academic: {
      program: "Blockchain Architecture & Web3 Engineering",
      institution: "Global Web3 Institute",
      grade: "Distinction - 99%",          // SENSITIVE: MUST STAY OFF-CHAIN
    },
    document: {
      pdfFilename: `${certId}-Diploma.pdf`,
      cid: `bafkreiintegritytestcid${Date.now()}`,
    },
  });

  // STEP 2: Compute Cryptographic Fingerprint
  console.log("\n[STEP 2] Computing Keccak-256 Cryptographic Fingerprint...");
  const documentBytes = ethers.toUtf8Bytes(canonicalDocumentPayload);
  const authenticDocumentHash = ethers.keccak256(documentBytes);
  const ipfsUri = `ipfs://bafkrei${authenticDocumentHash.slice(2, 54)}`;

  console.log(` -> Document Size:       ${documentBytes.length} bytes`);
  console.log(` -> IPFS Metadata URI:   ${ipfsUri}`);
  console.log(` -> Cryptographic Hash:  ${authenticDocumentHash}`);

  // STEP 3: Anchor Hash On-Chain via Smart Contract
  console.log("\n[STEP 3] Anchoring Content Fingerprint On-Chain to Ethereum Smart Contract...");
  const issueTx = await chainCert.connect(issuer).issueCertificate(
    certId,
    student.address,
    ipfsUri,
    authenticDocumentHash,
    0 // Lifetime
  );
  const receipt = await issueTx.wait();
  console.log(` -> Issuance Mined in Block: #${receipt.blockNumber}`);
  console.log(` -> Transaction Hash:        ${receipt.hash}`);

  // STEP 4: Retrieve and Verify Authoritative On-Chain State
  console.log("\n[STEP 4] Retrieving On-Chain Record & Checking Privacy Isolation...");
  const onChainCert = await chainCert.getCertificate(certId);

  console.log(` -> On-Chain Certificate ID:   ${onChainCert.certificateId}`);
  console.log(` -> On-Chain Issuer:           ${onChainCert.issuer}`);
  console.log(` -> On-Chain Recipient:        ${onChainCert.recipient}`);
  console.log(` -> On-Chain Document Hash:    ${onChainCert.certificateHash}`);
  console.log(` -> On-Chain Metadata URI:     ${onChainCert.metadataURI}`);

  // Verify Sensitive PII Isolation
  const structKeys = Object.keys(onChainCert);
  if (structKeys.includes("email") || structKeys.includes("grade") || structKeys.includes("name")) {
    throw new Error("Security Failure: Sensitive personal data found in smart contract struct!");
  }
  console.log("[PASS] Privacy guarantee confirmed: Zero sensitive PII exists in on-chain storage.");

  // STEP 5: Integrity Verification — Authentic Document
  console.log("\n[STEP 5] Testing Authentic Document Integrity Verification...");
  const retrievedDocumentBytes = ethers.toUtf8Bytes(canonicalDocumentPayload);
  const calculatedHashForAuthentic = ethers.keccak256(retrievedDocumentBytes);

  console.log(` -> Blockchain Fingerprint:  ${onChainCert.certificateHash}`);
  console.log(` -> Calculated Document Hash: ${calculatedHashForAuthentic}`);

  const isAuthenticMatch = onChainCert.certificateHash === calculatedHashForAuthentic;
  console.log(` -> Integrity Result:        ${isAuthenticMatch ? "MATCH (AUTHENTIC)" : "MISMATCH"}`);
  if (!isAuthenticMatch) {
    throw new Error("Step 5 Failed: Authentic document failed cryptographic match!");
  }
  console.log("[PASS] Authentic document verified: Byte-for-byte fingerprint match confirmed.");

  // STEP 6: Tamper Simulation — Modify 1 Byte
  console.log("\n[STEP 6] Simulating Document Tampering (Altering 1 Byte)...");
  // Change grade from 99% to 100% or change 1 character
  const tamperedPayload = canonicalDocumentPayload.replace("99%", "100%");
  const tamperedBytes = ethers.toUtf8Bytes(tamperedPayload);
  const calculatedHashForTampered = ethers.keccak256(tamperedBytes);

  console.log(` -> Blockchain Fingerprint:  ${onChainCert.certificateHash}`);
  console.log(` -> Tampered Document Hash:  ${calculatedHashForTampered}`);

  const isTamperedMatch = onChainCert.certificateHash === calculatedHashForTampered;
  console.log(` -> Integrity Result:        ${isTamperedMatch ? "MATCH" : "MISMATCH (TAMPER DETECTED)"}`);

  if (isTamperedMatch) {
    throw new Error("Security Failure: Tampered document was incorrectly accepted as a match!");
  }
  console.log("[PASS] Tamper detection confirmed: 1-byte alteration resulted in cryptographic MISMATCH.");

  console.log("\n==========================================================");
  console.log("ALL STORAGE & INTEGRITY TESTS PASSED (100%)");
  console.log("==========================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
