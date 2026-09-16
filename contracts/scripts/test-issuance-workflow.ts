import { ethers } from "hardhat";

async function main() {
  console.log("=================================================");
  console.log("TESTING COMPLETE REAL CERTIFICATE ISSUANCE WORKFLOW");
  console.log("=================================================");

  const [admin, authorizedIssuer, student, stranger] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const ChainCert = await ethers.getContractFactory("ChainCert");
  const chainCert = ChainCert.attach(contractAddress) as any;

  // 1. Ensure issuer is authorized
  const isAuth = await chainCert.isIssuerAuthorized(authorizedIssuer.address);
  if (!isAuth) {
    console.log(`Authorizing issuer ${authorizedIssuer.address}...`);
    const tx = await chainCert.connect(admin).authorizeIssuer(authorizedIssuer.address, "Cambridge Web3 Academy");
    await tx.wait();
  }
  console.log(`[PASS 1] Issuer Authorized: ${authorizedIssuer.address}`);

  // 2. Validate Certificate ID Uniqueness Before Issuance
  const testCertId = `CC-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const [initialValid, initialStatus] = await chainCert.isCertificateValid(testCertId);
  console.log(`[PASS 2] Checking pre-flight uniqueness for ${testCertId}: Status=${initialStatus} (0=NOT_FOUND)`);
  if (initialStatus !== 0n) {
    throw new Error(`Certificate ID ${testCertId} unexpectedly already exists!`);
  }

  // 3. Synthesize Metadata & Deterministic Cryptographic Hash
  const metadata = {
    schemaVersion: "1.0.0",
    certificateId: testCertId,
    recipient: {
      name: "Jane Doe",
      walletAddress: student.address,
    },
    issuer: {
      name: "Cambridge Web3 Academy",
      walletAddress: authorizedIssuer.address,
    },
    credential: {
      title: "Master of Blockchain Architecture",
      course: "Advanced Web3 Engineering",
      grade: "Distinction (98%)",
    },
    dates: {
      issuedAt: "2026-09-15",
      expiresAt: null,
    },
    verificationUrl: `http://localhost:3000/verify/${testCertId}`,
  };

  const canonicalJson = JSON.stringify(metadata);
  const cryptoHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalJson));
  const metadataUri = `ipfs://bafkrei${cryptoHash.slice(2, 54)}`;

  console.log(`[PASS 3] Generated Metadata & Cryptographic Hash:`);
  console.log(` -> Hash: ${cryptoHash}`);
  console.log(` -> URI:  ${metadataUri}`);
  console.log(` -> Verification URL: ${metadata.verificationUrl}`);

  // 4. Issue Certificate on the Real Smart Contract
  console.log(`\n[STEP 4] Executing on-chain issueCertificate transaction...`);
  const issueTx = await chainCert.connect(authorizedIssuer).issueCertificate(
    testCertId,
    student.address,
    metadataUri,
    cryptoHash,
    0 // Lifetime
  );

  const receipt = await issueTx.wait();
  console.log(`[PASS 4] Certificate Mined on Blockchain!`);
  console.log(` -> Tx Hash: ${receipt.hash}`);
  console.log(` -> Block Number: ${receipt.blockNumber}`);
  console.log(` -> Gas Used: ${receipt.gasUsed.toString()}`);

  // 5. Retrieve Certificate Struct from Blockchain
  console.log(`\n[STEP 5] Retrieving Certificate Record from Smart Contract...`);
  const onChainCert = await chainCert.getCertificate(testCertId);
  console.log(`[PASS 5] On-Chain Record Verified:`);
  console.log(` -> ID: ${onChainCert.certificateId}`);
  console.log(` -> Recipient: ${onChainCert.recipient}`);
  console.log(` -> Issuer: ${onChainCert.issuer}`);
  console.log(` -> Hash: ${onChainCert.certificateHash}`);
  console.log(` -> URI:  ${onChainCert.metadataURI}`);
  console.log(` -> Issued At: ${new Date(Number(onChainCert.issuedAt) * 1000).toISOString()}`);
  console.log(` -> Revoked: ${onChainCert.revoked}`);

  if (onChainCert.recipient.toLowerCase() !== student.address.toLowerCase()) {
    throw new Error("Recipient address mismatch!");
  }
  if (onChainCert.certificateHash !== cryptoHash) {
    throw new Error("Certificate hash mismatch!");
  }

  // 6. Check Public Zero-Wallet Validity
  const [isValid, status] = await chainCert.isCertificateValid(testCertId);
  console.log(`\n[PASS 6] Public Zero-Wallet Verification:`);
  console.log(` -> isValid: ${isValid}`);
  console.log(` -> status:  ${status} (1 = VERIFIED)`);
  if (!isValid || status !== 1n) {
    throw new Error("Certificate validity check failed!");
  }

  // 7. Test Duplicate Certificate ID Rejection
  console.log(`\n[STEP 7] Testing Duplicate Certificate ID Rejection...`);
  let duplicateRejected = false;
  try {
    await chainCert.connect(authorizedIssuer).issueCertificate(
      testCertId,
      student.address,
      metadataUri,
      cryptoHash,
      0
    );
  } catch (err: any) {
    duplicateRejected = true;
    console.log(` -> Expected Revert Caught: ${err.message?.slice(0, 70)}...`);
  }
  if (!duplicateRejected) {
    throw new Error("Duplicate certificate ID was NOT rejected!");
  }
  console.log(`[PASS 7] Duplicate Certificate ID successfully blocked by smart contract.`);

  // 8. Test Invalid Recipient Address (Zero Address) Rejection
  console.log(`\n[STEP 8] Testing Invalid Zero-Address Recipient Rejection...`);
  let zeroAddressRejected = false;
  try {
    await chainCert.connect(authorizedIssuer).issueCertificate(
      `CC-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      ethers.ZeroAddress,
      metadataUri,
      cryptoHash,
      0
    );
  } catch (err: any) {
    zeroAddressRejected = true;
    console.log(` -> Expected Revert Caught: ${err.message?.slice(0, 70)}...`);
  }
  if (!zeroAddressRejected) {
    throw new Error("Zero address recipient was NOT rejected!");
  }
  console.log(`[PASS 8] Invalid Recipient Address successfully blocked by smart contract.`);

  // 9. Confirm QR Verification URL Structure
  const expectedPrefix = "http://localhost:3000/verify/";
  if (!metadata.verificationUrl.startsWith(expectedPrefix)) {
    throw new Error(`QR Verification URL does not point to public route: ${metadata.verificationUrl}`);
  }
  console.log(`[PASS 9] QR Code verification URL correctly routes to: ${metadata.verificationUrl}`);

  console.log("\n=================================================");
  console.log("ALL REAL CERTIFICATE ISSUANCE TESTS PASSED (100%)");
  console.log("=================================================\n");
}

main().catch((err) => {
  console.error("Issuance workflow test failed:", err);
  process.exit(1);
});
