import { ethers } from "hardhat";

async function main() {
  console.log("==========================================================");
  console.log("TESTING PUBLIC ZERO-WALLET BLOCKCHAIN VERIFICATION SYSTEM");
  console.log("==========================================================");

  // Use a read-only provider (no signer, simulating zero-wallet public browser)
  const provider = ethers.provider;
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ChainCert = await ethers.getContractFactory("ChainCert");
  const readOnlyContract = ChainCert.attach(contractAddress).connect(provider) as any;

  // 1. Test VERIFIED / ACTIVE State (CC-2026-000001)
  console.log("\n[TEST 1] Querying VERIFIED / ACTIVE state for CC-2026-000001...");
  const [isValid1, status1] = await readOnlyContract.isCertificateValid("CC-2026-000001");
  console.log(` -> isValid: ${isValid1}`);
  console.log(` -> status:  ${status1} (1 = VERIFIED)`);
  if (!isValid1 || status1 !== 1n) {
    throw new Error("Test 1 Failed: CC-2026-000001 must be VERIFIED (1)");
  }
  const cert1 = await readOnlyContract.getCertificate("CC-2026-000001");
  const inst1 = await readOnlyContract.getInstitutionName(cert1.issuer);
  console.log(` -> Recipient: ${cert1.recipient}`);
  console.log(` -> Issuer: ${cert1.issuer} (${inst1})`);
  console.log(` -> Hash: ${cert1.certificateHash}`);
  console.log("[PASS 1] VERIFIED / ACTIVE state confirmed on-chain.");

  // 2. Test REVOKED State (CC-2026-000002)
  console.log("\n[TEST 2] Querying REVOKED state for CC-2026-000002...");
  const [isValid2, status2] = await readOnlyContract.isCertificateValid("CC-2026-000002");
  console.log(` -> isValid: ${isValid2}`);
  console.log(` -> status:  ${status2} (2 = REVOKED)`);
  if (isValid2 || status2 !== 2n) {
    throw new Error("Test 2 Failed: CC-2026-000002 must be REVOKED (2)");
  }
  const cert2 = await readOnlyContract.getCertificate("CC-2026-000002");
  console.log(` -> Revoked boolean: ${cert2.revoked}`);
  console.log(` -> Revocation Reason: "${cert2.revocationReason}"`);
  console.log(` -> Revoked At Timestamp: ${cert2.revokedAt}`);
  if (!cert2.revoked || !cert2.revocationReason) {
    throw new Error("Test 2 Failed: Revocation details missing from on-chain struct");
  }
  console.log("[PASS 2] REVOKED state & audit reason confirmed on-chain.");

  // 3. Test EXPIRED State (CC-2026-000003)
  console.log("\n[TEST 3] Querying EXPIRED state for CC-2026-000003...");
  const [isValid3, status3] = await readOnlyContract.isCertificateValid("CC-2026-000003");
  console.log(` -> isValid: ${isValid3}`);
  console.log(` -> status:  ${status3} (3 = EXPIRED)`);
  if (isValid3 || status3 !== 3n) {
    throw new Error("Test 3 Failed: CC-2026-000003 must be EXPIRED (3)");
  }
  const cert3 = await readOnlyContract.getCertificate("CC-2026-000003");
  const block = await provider.getBlock("latest");
  console.log(` -> Expires At: ${cert3.expiresAt}`);
  console.log(` -> Current Block Time: ${block?.timestamp}`);
  if (Number(cert3.expiresAt) >= Number(block?.timestamp)) {
    throw new Error("Test 3 Failed: ExpiresAt must be earlier than block timestamp");
  }
  console.log("[PASS 3] EXPIRED state confirmed on-chain.");

  // 4. Test NOT_FOUND State (CC-NONEXISTENT-999)
  console.log("\n[TEST 4] Querying NOT_FOUND state for CC-NONEXISTENT-999...");
  const [isValid4, status4] = await readOnlyContract.isCertificateValid("CC-NONEXISTENT-999");
  console.log(` -> isValid: ${isValid4}`);
  console.log(` -> status:  ${status4} (0 = NOT_FOUND)`);
  if (isValid4 || status4 !== 0n) {
    throw new Error("Test 4 Failed: CC-NONEXISTENT-999 must return status 0 (NOT_FOUND)");
  }
  console.log("[PASS 4] NOT_FOUND state confirmed on-chain.");

  console.log("\n==========================================================");
  console.log("ALL 4 ON-CHAIN VERIFICATION STATES TESTED & VERIFIED 100%");
  console.log("==========================================================\n");
}

main().catch((err) => {
  console.error("Public verification test failed:", err);
  process.exit(1);
});
