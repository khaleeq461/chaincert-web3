import { ethers } from "hardhat";

async function main() {
  console.log("==========================================================");
  console.log("TESTING STUDENT/CERTIFICATE-HOLDER ON-CHAIN RETRIEVAL");
  console.log("==========================================================");

  const [admin, demoIssuer, student, emptyWallet] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ChainCert = await ethers.getContractFactory("ChainCert");
  const readOnlyProvider = ethers.provider;
  const readOnlyContract = ChainCert.attach(contractAddress).connect(readOnlyProvider) as any;

  console.log(`\n[STEP 1] Querying certificates owned by Student (${student.address})...`);
  const studentCertIds = await readOnlyContract.getCertificatesByRecipient(student.address);
  console.log(` -> Found ${studentCertIds.length} certificates registered for this wallet.`);

  if (studentCertIds.length === 0) {
    throw new Error("Student wallet must have certificates issued in previous workflow tests!");
  }

  let activeCount = 0;
  let revokedCount = 0;
  let expiredCount = 0;

  for (const id of studentCertIds) {
    const cert = await readOnlyContract.getCertificate(id);
    const [isValid, status] = await readOnlyContract.isCertificateValid(id);
    const instName = await readOnlyContract.getInstitutionName(cert.issuer);

    console.log(`\n -> Certificate ID: ${id}`);
    console.log(`    Issuer:      ${cert.issuer} (${instName})`);
    console.log(`    Hash:        ${cert.certificateHash}`);
    console.log(`    Issued At:   ${new Date(Number(cert.issuedAt) * 1000).toISOString()}`);
    console.log(`    Status Code: ${status} (${status === 1n ? 'VERIFIED' : status === 2n ? 'REVOKED' : status === 3n ? 'EXPIRED' : 'NOT_FOUND'})`);

    if (status === 1n) activeCount++;
    if (status === 2n) {
      revokedCount++;
      console.log(`    Revocation Reason: "${cert.revocationReason}"`);
    }
    if (status === 3n) expiredCount++;
  }

  console.log("\n[STEP 2] Portfolio Metrics Summary:");
  console.log(` -> Total Credentials:   ${studentCertIds.length}`);
  console.log(` -> Active Credentials:  ${activeCount}`);
  console.log(` -> Revoked Credentials: ${revokedCount}`);
  console.log(` -> Expired Credentials: ${expiredCount}`);

  // Test empty wallet
  console.log(`\n[STEP 3] Testing empty wallet portfolio (${emptyWallet.address})...`);
  const emptyCerts = await readOnlyContract.getCertificatesByRecipient(emptyWallet.address);
  console.log(` -> Retrieved ${emptyCerts.length} certificates for empty wallet.`);
  if (emptyCerts.length !== 0) {
    throw new Error("Empty wallet should have 0 certificates!");
  }
  console.log("[PASS 3] Empty wallet returns empty roster cleanly.");

  console.log("\n==========================================================");
  console.log("ALL STUDENT EXPERIENCE RETRIEVAL TESTS PASSED (100%)");
  console.log("==========================================================\n");
}

main().catch((err) => {
  console.error("Student experience test failed:", err);
  process.exit(1);
});
