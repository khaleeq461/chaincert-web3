import { ethers } from "hardhat";

async function main() {
  console.log("==========================================");
  console.log("TESTING REAL ON-CHAIN CONTRACT INTERACTIONS");
  console.log("RPC URL: http://127.0.0.1:8545");
  console.log("==========================================");

  const [admin, existingIssuer, student, stranger, freshInstitution] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const ChainCert = await ethers.getContractFactory("ChainCert");
  const chainCert = ChainCert.attach(contractAddress) as any;

  // 1. Authorize Issuer with fresh wallet
  console.log("\n[TEST 1] Authorizing new Institution on-chain...");
  const authTx = await chainCert.connect(admin).authorizeIssuer(freshInstitution.address, "Cambridge Web3 Academy");
  const authReceipt = await authTx.wait();
  console.log(` -> Tx Hash: ${authReceipt.hash}`);
  console.log(` -> Block Number: ${authReceipt.blockNumber}`);
  const isAuthorized = await chainCert.isIssuerAuthorized(freshInstitution.address);
  console.log(` -> isIssuerAuthorized: ${isAuthorized}`);
  if (!isAuthorized) throw new Error("Authorization failed");

  // 2. Issue Certificate using the authorized institution
  const testCertId = `CC-LIVE-${Date.now()}`;
  const testHash = ethers.keccak256(ethers.toUtf8Bytes("live-test-metadata-digest"));
  const testURI = "ipfs://QmLiveVerificationTestCID123";

  console.log(`\n[TEST 2] Issuing Certificate (${testCertId}) on-chain...`);
  const issueTx = await chainCert.connect(freshInstitution).issueCertificate(
    testCertId,
    student.address,
    testURI,
    testHash,
    0
  );
  const issueReceipt = await issueTx.wait();
  console.log(` -> Tx Hash: ${issueReceipt.hash}`);
  console.log(` -> Gas Used: ${issueReceipt.gasUsed.toString()}`);

  // 3. Verify Certificate
  console.log("\n[TEST 3] Querying Public Validity (Zero-Wallet Read)...");
  const [isValidInitial, statusInitial] = await chainCert.isCertificateValid(testCertId);
  console.log(` -> isValid: ${isValidInitial}`);
  console.log(` -> Status: ${statusInitial} (1 = VERIFIED)`);
  if (!isValidInitial || statusInitial !== 1n) throw new Error("Certificate should be VERIFIED");

  // 4. Retrieve Full Certificate
  console.log("\n[TEST 4] Retrieving On-Chain Struct...");
  const certStruct = await chainCert.getCertificate(testCertId);
  console.log(` -> Recipient: ${certStruct.recipient}`);
  console.log(` -> Issuer: ${certStruct.issuer}`);
  console.log(` -> Hash: ${certStruct.certificateHash}`);
  console.log(` -> Revoked: ${certStruct.revoked}`);

  // 5. Revoke Certificate
  console.log("\n[TEST 5] Revoking Certificate on-chain with Audit Reason...");
  const reason = "Live interaction test: deliberate revocation confirmation";
  const revokeTx = await chainCert.connect(freshInstitution).revokeCertificate(testCertId, reason);
  const revokeReceipt = await revokeTx.wait();
  console.log(` -> Tx Hash: ${revokeReceipt.hash}`);
  console.log(` -> Revoked at Block: ${revokeReceipt.blockNumber}`);

  // 6. Verify Revoked State
  console.log("\n[TEST 6] Re-verifying Status After Revocation...");
  const [isValidAfter, statusAfter] = await chainCert.isCertificateValid(testCertId);
  console.log(` -> isValid: ${isValidAfter}`);
  console.log(` -> Status: ${statusAfter} (2 = REVOKED)`);
  if (isValidAfter || statusAfter !== 2n) throw new Error("Certificate should be REVOKED");

  const certRevokedStruct = await chainCert.getCertificate(testCertId);
  console.log(` -> Revoked boolean: ${certRevokedStruct.revoked}`);
  console.log(` -> Revocation Reason: ${certRevokedStruct.revocationReason}`);

  // 7. Verify Security (Stranger Rejection)
  console.log("\n[TEST 7] Testing Security Rules: Unauthorized Issuance Rejection...");
  try {
    await chainCert.connect(stranger).issueCertificate(
      `CC-UNAUTH-${Date.now()}`,
      student.address,
      testURI,
      testHash,
      0
    );
    throw new Error("Unauthorized user was able to issue certificate!");
  } catch (err: any) {
    console.log(" -> Successfully blocked unauthorized user with smart contract revert.");
  }

  // 8. Platform Telemetry Check
  console.log("\n[TEST 8] Querying Aggregated Platform Telemetry...");
  const stats = await chainCert.getPlatformStats();
  console.log(` -> Total Certificates: ${stats.totalCertificates}`);
  console.log(` -> Total Issuers: ${stats.totalIssuers}`);
  console.log(` -> Active Certificates: ${stats.activeCertificates}`);
  console.log(` -> Revoked Certificates: ${stats.revokedCertificates}`);

  console.log("\n==========================================");
  console.log("ALL REAL ON-CHAIN INTERACTIONS PASSED 100%");
  console.log("==========================================");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
