import { ethers } from "hardhat";

async function main() {
  console.log("==========================================================");
  console.log("TESTING COMPLETE REAL CERTIFICATE REVOCATION WORKFLOW");
  console.log("==========================================================");

  const [admin, authorizedIssuer, student, stranger] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ChainCert = await ethers.getContractFactory("ChainCert");
  const chainCert = ChainCert.attach(contractAddress) as any;
  const readOnlyProvider = ethers.provider;
  const readOnlyContract = ChainCert.attach(contractAddress).connect(readOnlyProvider) as any;

  // Ensure authorizedIssuer has ISSUER_ROLE
  const isAuth = await chainCert.isIssuerAuthorized(authorizedIssuer.address);
  if (!isAuth) {
    const authTx = await chainCert.connect(admin).authorizeIssuer(authorizedIssuer.address, "Cambridge Web3 Academy");
    await authTx.wait();
  }
  console.log(`[SETUP] Issuer Authorized: ${authorizedIssuer.address}`);

  // STEP 1: Issue a new certificate
  const testCertId = `CC-REVOKE-${Date.now()}`;
  const testHash = ethers.keccak256(ethers.toUtf8Bytes(`metadata-for-${testCertId}`));
  const testURI = `ipfs://bafkreirevoketestcid${Date.now()}`;

  console.log(`\n[STEP 1] Issuing Certificate (${testCertId}) on-chain...`);
  const issueTx = await chainCert.connect(authorizedIssuer).issueCertificate(
    testCertId,
    student.address,
    testURI,
    testHash,
    0 // Lifetime
  );
  const issueReceipt = await issueTx.wait();
  console.log(` -> Mined in Tx: ${issueReceipt.hash}`);
  console.log(` -> Block Number: ${issueReceipt.blockNumber}`);

  // STEP 2: Verify it publicly (Zero-Wallet Read)
  console.log(`\n[STEP 2] Verifying Certificate publicly BEFORE revocation...`);
  const [isValidBefore, statusBefore] = await readOnlyContract.isCertificateValid(testCertId);
  console.log(` -> isValid: ${isValidBefore}`);
  console.log(` -> status:  ${statusBefore} (1 = VERIFIED)`);
  if (!isValidBefore || statusBefore !== 1n) {
    throw new Error(`Step 2 Failed: Expected certificate to be VERIFIED (1), got ${statusBefore}`);
  }
  const certBefore = await readOnlyContract.getCertificate(testCertId);
  console.log(` -> On-Chain Revoked Flag: ${certBefore.revoked}`);
  if (certBefore.revoked) {
    throw new Error("Step 2 Failed: Newly issued certificate has revoked = true");
  }
  console.log("[PASS 2] Certificate successfully verified as ACTIVE / VERIFIED.");

  // STEP 3: Revoke it with documented audit reason
  const auditReason = "Academic Integrity Audit: Credential revoked due to disciplinary board ruling.";
  console.log(`\n[STEP 3] Revoking Certificate (${testCertId}) on-chain...`);
  console.log(` -> Audit Reason: "${auditReason}"`);

  // Verify unauthorized stranger cannot revoke
  let strangerBlocked = false;
  try {
    await chainCert.connect(stranger).revokeCertificate(testCertId, auditReason);
  } catch (err: any) {
    strangerBlocked = true;
  }
  if (!strangerBlocked) {
    throw new Error("Security Violation: Unauthorized stranger was able to revoke certificate!");
  }
  console.log(" -> Security Check: Unauthorized stranger blocked by smart contract.");

  // Execute real revocation from authorized issuer
  const revokeTx = await chainCert.connect(authorizedIssuer).revokeCertificate(testCertId, auditReason);
  const revokeReceipt = await revokeTx.wait();
  console.log(` -> Revocation Mined in Tx: ${revokeReceipt.hash}`);
  console.log(` -> Block Number: ${revokeReceipt.blockNumber}`);
  console.log(` -> Gas Used: ${revokeReceipt.gasUsed.toString()}`);

  // STEP 4: Verify the same certificate publicly again
  console.log(`\n[STEP 4] Verifying the same Certificate publicly AFTER revocation...`);
  const [isValidAfter, statusAfter] = await readOnlyContract.isCertificateValid(testCertId);
  console.log(` -> isValid: ${isValidAfter}`);
  console.log(` -> status:  ${statusAfter} (2 = REVOKED)`);

  // STEP 5: Confirm that status changes from VERIFIED/ACTIVE to REVOKED
  console.log(`\n[STEP 5] Confirming Status Transition (VERIFIED -> REVOKED)...`);
  if (isValidAfter !== false) {
    throw new Error("Step 5 Failed: isValid must be FALSE after revocation!");
  }
  if (statusAfter !== 2n) {
    throw new Error(`Step 5 Failed: Expected status to be REVOKED (2), got ${statusAfter}`);
  }

  const certAfter = await readOnlyContract.getCertificate(testCertId);
  console.log(` -> On-Chain Revoked Flag: ${certAfter.revoked}`);
  console.log(` -> On-Chain Revoked At:   ${new Date(Number(certAfter.revokedAt) * 1000).toISOString()}`);
  console.log(` -> On-Chain Reason:       "${certAfter.revocationReason}"`);

  if (!certAfter.revoked) {
    throw new Error("Step 5 Failed: cert.revoked is not true!");
  }
  if (certAfter.revocationReason !== auditReason) {
    throw new Error("Step 5 Failed: Revocation reason mismatch!");
  }

  // STEP 6: Confirm certificate cannot silently become valid again or be double-revoked
  console.log(`\n[STEP 6] Security Check: Ensuring certificate cannot be double-revoked or re-issued...`);
  let doubleRevokeBlocked = false;
  try {
    await chainCert.connect(authorizedIssuer).revokeCertificate(testCertId, "Double revocation attempt");
  } catch (err: any) {
    doubleRevokeBlocked = true;
  }
  if (!doubleRevokeBlocked) {
    throw new Error("Security Violation: Certificate was revoked twice without reverting!");
  }
  console.log(" -> Double revocation blocked by smart contract.");

  let reissuanceBlocked = false;
  try {
    await chainCert.connect(authorizedIssuer).issueCertificate(
      testCertId,
      student.address,
      testURI,
      testHash,
      0
    );
  } catch (err: any) {
    reissuanceBlocked = true;
  }
  if (!reissuanceBlocked) {
    throw new Error("Security Violation: Revoked certificate was silently overwritten by new issuance!");
  }
  console.log(" -> Re-issuance with duplicate ID blocked by smart contract.");

  console.log("\n==========================================================");
  console.log("ALL REAL REVOCATION WORKFLOW TESTS PASSED (100%)");
  console.log("==========================================================\n");
}

main().catch((err) => {
  console.error("Revocation workflow test failed:", err);
  process.exit(1);
});
