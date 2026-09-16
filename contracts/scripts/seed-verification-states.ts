import { ethers } from "hardhat";

async function main() {
  console.log("==================================================");
  console.log("SEEDING REAL ON-CHAIN CERTIFICATES FOR ALL 4 STATES");
  console.log("==================================================");

  const [admin, demoIssuer, student] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ChainCert = await ethers.getContractFactory("ChainCert");
  const chainCert = ChainCert.attach(contractAddress) as any;

  // Ensure demoIssuer has ISSUER_ROLE
  const isAuth = await chainCert.isIssuerAuthorized(demoIssuer.address);
  if (!isAuth) {
    const authTx = await chainCert.connect(admin).authorizeIssuer(demoIssuer.address, "Cambridge Web3 Academy");
    await authTx.wait();
  }

  // STATE 1: CC-2026-000001 -> VERIFIED / ACTIVE
  const [, status1] = await chainCert.isCertificateValid("CC-2026-000001");
  if (status1 === 0n) {
    const hash1 = ethers.keccak256(ethers.toUtf8Bytes("cert-1-verified-payload"));
    const tx1 = await chainCert.connect(demoIssuer).issueCertificate(
      "CC-2026-000001",
      student.address,
      "ipfs://bafkreicert1verifiedsamplepayloadcid1234567890",
      hash1,
      0 // Lifetime
    );
    await tx1.wait();
    console.log("[STATE 1] Issued Active Certificate: CC-2026-000001");
  } else {
    console.log(`[STATE 1] CC-2026-000001 already exists (Status = ${status1})`);
  }

  // STATE 2: CC-2026-000002 -> REVOKED
  const [, status2] = await chainCert.isCertificateValid("CC-2026-000002");
  if (status2 === 0n) {
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("cert-2-revoked-payload"));
    const tx2 = await chainCert.connect(demoIssuer).issueCertificate(
      "CC-2026-000002",
      student.address,
      "ipfs://bafkreicert2revokedsamplepayloadcid1234567890",
      hash2,
      0
    );
    await tx2.wait();
    console.log("[STATE 2] Issued CC-2026-000002 for Revocation...");

    const revokeTx = await chainCert.connect(demoIssuer).revokeCertificate(
      "CC-2026-000002",
      "Academic Integrity Audit: Credential revoked due to unverified coursework submission."
    );
    await revokeTx.wait();
    console.log("[STATE 2] Revoked CC-2026-000002 with audit reason.");
  } else if (status2 === 1n) {
    const revokeTx = await chainCert.connect(demoIssuer).revokeCertificate(
      "CC-2026-000002",
      "Academic Integrity Audit: Credential revoked due to unverified coursework submission."
    );
    await revokeTx.wait();
    console.log("[STATE 2] Revoked existing CC-2026-000002.");
  } else {
    console.log(`[STATE 2] CC-2026-000002 already in revoked state (Status = ${status2})`);
  }

  // STATE 3: CC-2026-000003 -> EXPIRED
  const [, status3] = await chainCert.isCertificateValid("CC-2026-000003");
  if (status3 === 0n) {
    const block = await ethers.provider.getBlock("latest");
    const now = block ? block.timestamp : Math.floor(Date.now() / 1000);
    const expiresSoon = now + 10; // Expires in 10 seconds

    const hash3 = ethers.keccak256(ethers.toUtf8Bytes("cert-3-expired-payload"));
    const tx3 = await chainCert.connect(demoIssuer).issueCertificate(
      "CC-2026-000003",
      student.address,
      "ipfs://bafkreicert3expiredsamplepayloadcid1234567890",
      hash3,
      expiresSoon
    );
    await tx3.wait();
    console.log(`[STATE 3] Issued CC-2026-000003 with expiry at ${expiresSoon}`);

    // Fast-forward Hardhat time past expiry
    await ethers.provider.send("evm_increaseTime", [3600]); // +1 hour
    await ethers.provider.send("evm_mine", []);
    console.log("[STATE 3] Advanced EVM time by 1 hour. CC-2026-000003 is now EXPIRED.");
  } else {
    console.log(`[STATE 3] CC-2026-000003 exists (Status = ${status3})`);
  }

  // Verify all 4 states
  const [v1, s1] = await chainCert.isCertificateValid("CC-2026-000001");
  const [v2, s2] = await chainCert.isCertificateValid("CC-2026-000002");
  const [v3, s3] = await chainCert.isCertificateValid("CC-2026-000003");
  const [v4, s4] = await chainCert.isCertificateValid("CC-NONEXISTENT-999");

  console.log("\n--- FINAL ON-CHAIN STATUS VERIFICATION ---");
  console.log(`1. CC-2026-000001: Valid=${v1}, Status=${s1} (Expected: 1 = VERIFIED)`);
  console.log(`2. CC-2026-000002: Valid=${v2}, Status=${s2} (Expected: 2 = REVOKED)`);
  console.log(`3. CC-2026-000003: Valid=${v3}, Status=${s3} (Expected: 3 = EXPIRED)`);
  console.log(`4. CC-NONEXISTENT: Valid=${v4}, Status=${s4} (Expected: 0 = NOT_FOUND)`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Failed to seed verification states:", err);
  process.exit(1);
});
