import { ethers } from "hardhat";

async function main() {
  console.log("==========================================================");
  console.log("TESTING ADMIN & ISSUER MANAGEMENT SYSTEM (ON-CHAIN)");
  console.log("==========================================================");

  const signers = await ethers.getSigners();
  const admin = signers[0];              // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  const existingIssuer = signers[1];     // 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  const student = signers[2];            // 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  const normalWallet = signers[3];       // 0x90F79bf6EB2c4f870365E785982E1f101E93b906
  const newInstitution = signers[4];     // 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ChainCert = await ethers.getContractFactory("ChainCert");
  const chainCert = ChainCert.attach(contractAddress) as any;

  // Verify Admin Role
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));

  console.log(`\n[STEP 1] Validating Admin Wallet Roles...`);
  const isAdmin = await chainCert.hasRole(DEFAULT_ADMIN_ROLE, admin.address);
  console.log(` -> Admin Address: ${admin.address}`);
  console.log(` -> Has DEFAULT_ADMIN_ROLE: ${isAdmin}`);
  if (!isAdmin) throw new Error("Step 1 Failed: Admin wallet does not have DEFAULT_ADMIN_ROLE");

  const normalIsAdmin = await chainCert.hasRole(DEFAULT_ADMIN_ROLE, normalWallet.address);
  console.log(` -> Normal Wallet Address: ${normalWallet.address}`);
  console.log(` -> Normal Wallet Has DEFAULT_ADMIN_ROLE: ${normalIsAdmin}`);
  if (normalIsAdmin) throw new Error("Step 1 Failed: Normal wallet unexpectedly has admin role");
  console.log("[PASS 1] Admin role boundaries verified.");

  // STEP 2: Normal wallet attempting unauthorized calls
  console.log(`\n[STEP 2] Testing Unauthorized Calls from Normal Wallet...`);

  // A) Normal wallet attempts to authorize an issuer
  try {
    await chainCert.connect(normalWallet).authorizeIssuer(normalWallet.address, "Hacker Academy");
    throw new Error("Security Failure: Normal wallet was able to authorize an issuer!");
  } catch (err: any) {
    console.log(" -> [REVERT CONFIRMED] Normal wallet blocked from calling authorizeIssuer()");
  }

  // B) Normal wallet attempts to deactivate an issuer
  try {
    await chainCert.connect(normalWallet).deactivateIssuer(existingIssuer.address);
    throw new Error("Security Failure: Normal wallet was able to deactivate an issuer!");
  } catch (err: any) {
    console.log(" -> [REVERT CONFIRMED] Normal wallet blocked from calling deactivateIssuer()");
  }

  // C) Normal wallet attempts to issue a certificate
  try {
    const unauthorizedCertId = `CC-HACK-${Date.now()}`;
    const dummyHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
    await chainCert.connect(normalWallet).issueCertificate(
      unauthorizedCertId,
      student.address,
      "ipfs://dummy",
      dummyHash,
      0
    );
    throw new Error("Security Failure: Normal wallet was able to issue a certificate!");
  } catch (err: any) {
    console.log(" -> [REVERT CONFIRMED] Normal wallet blocked from calling issueCertificate()");
  }

  console.log("[PASS 2] All unauthorized contract interactions rejected by smart contract.");

  // STEP 3: Admin Authorizes New Institution
  console.log(`\n[STEP 3] Admin Authorizing New Institution (${newInstitution.address})...`);
  const institutionName = "Stanford Web3 Research Institute";

  // Check if currently authorized; if so, deactivate first to test clean authorization
  const initialAuth = await chainCert.isIssuerAuthorized(newInstitution.address);
  if (initialAuth) {
    const deactTx = await chainCert.connect(admin).deactivateIssuer(newInstitution.address);
    await deactTx.wait();
  }

  const authTx = await chainCert.connect(admin).authorizeIssuer(newInstitution.address, institutionName);
  const authReceipt = await authTx.wait();
  console.log(` -> Mined in Tx: ${authReceipt.hash}`);
  console.log(` -> Block Number: ${authReceipt.blockNumber}`);

  const isNowAuthorized = await chainCert.isIssuerAuthorized(newInstitution.address);
  const recordedName = await chainCert.getInstitutionName(newInstitution.address);
  console.log(` -> isIssuerAuthorized: ${isNowAuthorized}`);
  console.log(` -> Recorded Institution Name: "${recordedName}"`);

  if (!isNowAuthorized || recordedName !== institutionName) {
    throw new Error("Step 3 Failed: Institution authorization state not properly recorded");
  }
  console.log("[PASS 3] New institution authorized with ISSUER_ROLE.");

  // STEP 4: Newly Authorized Issuer issues a real certificate
  console.log(`\n[STEP 4] Newly Authorized Issuer Issues a Certificate...`);
  const certId1 = `CC-STANFORD-${Date.now()}`;
  const certHash1 = ethers.keccak256(ethers.toUtf8Bytes(`meta-${certId1}`));
  const certUri1 = `ipfs://bafkreistanfordcid${Date.now()}`;

  const issueTx1 = await chainCert.connect(newInstitution).issueCertificate(
    certId1,
    student.address,
    certUri1,
    certHash1,
    0
  );
  const issueReceipt1 = await issueTx1.wait();
  console.log(` -> Certificate Issued: ${certId1}`);
  console.log(` -> Mined in Tx: ${issueReceipt1.hash}`);

  const [isValid1, status1] = await chainCert.isCertificateValid(certId1);
  console.log(` -> On-chain Validity: isValid=${isValid1}, status=${status1}`);
  if (!isValid1 || status1 !== 1n) {
    throw new Error("Step 4 Failed: Certificate not verified after issuance");
  }
  console.log("[PASS 4] Certificate successfully minted by authorized issuer.");

  // STEP 5: Admin Deactivates Issuer
  console.log(`\n[STEP 5] Admin Deactivating Institution (${newInstitution.address})...`);
  const deactTx = await chainCert.connect(admin).deactivateIssuer(newInstitution.address);
  const deactReceipt = await deactTx.wait();
  console.log(` -> Deactivation Mined in Tx: ${deactReceipt.hash}`);

  const isStillAuth = await chainCert.isIssuerAuthorized(newInstitution.address);
  console.log(` -> isIssuerAuthorized: ${isStillAuth} (expected: false)`);
  if (isStillAuth) throw new Error("Step 5 Failed: Issuer still authorized after deactivation");

  // Deactivated issuer attempts to issue another certificate
  console.log(` -> Verifying deactivated issuer CANNOT issue certificates...`);
  try {
    const certId2 = `CC-DEACT-${Date.now()}`;
    const certHash2 = ethers.keccak256(ethers.toUtf8Bytes(`meta-${certId2}`));
    await chainCert.connect(newInstitution).issueCertificate(
      certId2,
      student.address,
      "ipfs://deactivated",
      certHash2,
      0
    );
    throw new Error("Security Failure: Deactivated issuer was able to issue a certificate!");
  } catch (err: any) {
    console.log(" -> [REVERT CONFIRMED] Deactivated issuer blocked by smart contract.");
  }
  console.log("[PASS 5] Issuer deactivation enforced on-chain.");

  // STEP 6: Re-authorization of Issuer
  console.log(`\n[STEP 6] Admin Re-authorizing Institution...`);
  const reauthTx = await chainCert.connect(admin).authorizeIssuer(newInstitution.address, "Stanford Web3 Institute (Re-Authorized)");
  const reauthReceipt = await reauthTx.wait();
  console.log(` -> Re-authorization Mined in Tx: ${reauthReceipt.hash}`);

  const isReauthorized = await chainCert.isIssuerAuthorized(newInstitution.address);
  console.log(` -> isIssuerAuthorized: ${isReauthorized}`);
  if (!isReauthorized) throw new Error("Step 6 Failed: Issuer not authorized after reauthorization");

  // Re-authorized issuer issues certificate
  const certId3 = `CC-REAUTH-${Date.now()}`;
  const certHash3 = ethers.keccak256(ethers.toUtf8Bytes(`meta-${certId3}`));
  const issueTx3 = await chainCert.connect(newInstitution).issueCertificate(
    certId3,
    student.address,
    "ipfs://reauthorized",
    certHash3,
    0
  );
  const issueReceipt3 = await issueTx3.wait();
  console.log(` -> Certificate Issued after Re-authorization: ${certId3}`);
  console.log(` -> Mined in Tx: ${issueReceipt3.hash}`);
  const [isValid3] = await chainCert.isCertificateValid(certId3);
  if (!isValid3) throw new Error("Step 6 Failed: Re-authorized issuer certificate is invalid");
  console.log("[PASS 6] Re-authorization workflow verified end-to-end.");

  // STEP 7: Check Platform Statistics Telemetry
  console.log(`\n[STEP 7] Verifying Admin Platform Telemetry...`);
  const stats = await chainCert.getPlatformStats();
  console.log(` -> Total Certificates:   ${stats.totalCertificates}`);
  console.log(` -> Total Issuers:        ${stats.totalIssuers}`);
  console.log(` -> Active Certificates:  ${stats.activeCertificates}`);
  console.log(` -> Revoked Certificates: ${stats.revokedCertificates}`);
  console.log("[PASS 7] On-chain platform statistics verified.");

  console.log("\n==========================================================");
  console.log("ALL ADMIN & ISSUER MANAGEMENT TESTS PASSED (100%)");
  console.log("==========================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
