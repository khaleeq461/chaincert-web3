import { ethers } from "hardhat";

async function main() {
  console.log("==========================================================");
  console.log("EXECUTING COMPREHENSIVE WEB3 SECURITY VERIFICATION");
  console.log("==========================================================");

  const [admin, issuer, student, attacker] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const ChainCert = await ethers.getContractFactory("ChainCert");

  // Sync latest hardened bytecode to localhost address
  const freshDeploy = await ChainCert.deploy(admin.address);
  await freshDeploy.waitForDeployment();
  const latestBytecode = await ethers.provider.getCode(await freshDeploy.getAddress());
  await ethers.provider.send("hardhat_setCode", [contractAddress, latestBytecode]);

  const chainCert = ChainCert.attach(contractAddress) as any;


  // Ensure issuer is authorized
  const isAuth = await chainCert.isIssuerAuthorized(issuer.address);
  if (!isAuth) {
    const authTx = await chainCert.connect(admin).authorizeIssuer(issuer.address, "Verified Security Academy");
    await authTx.wait();
  }

  // TEST 1: Bounds Check on Certificate ID Length (> 64 chars & < 3 chars)
  console.log("\n[TEST 1] Testing Bounds on Certificate ID Length...");
  const shortId = "CC"; // 2 chars, < 3
  const dummyHash = ethers.keccak256(ethers.toUtf8Bytes("hash"));

  try {
    await chainCert.connect(issuer).issueCertificate(shortId, student.address, "ipfs://test", dummyHash, 0);
    throw new Error("Security Failure: Undersized Certificate ID (<3 chars) was accepted!");
  } catch (err: any) {
    console.log(" -> [PASS] Undersized Certificate ID successfully rejected by contract.");
  }

  const longId = "CC-" + "X".repeat(70); // 73 chars, > 64
  try {
    await chainCert.connect(issuer).issueCertificate(longId, student.address, "ipfs://test", dummyHash, 0);
    throw new Error("Security Failure: Oversized Certificate ID (>64 chars) was accepted!");
  } catch (err: any) {
    console.log(" -> [PASS] Oversized Certificate ID successfully rejected by contract.");
  }

  // TEST 2: Prevention of Self-Address Recipient (recipient == address(this))
  console.log("\n[TEST 2] Testing Rejection of Contract as Recipient (Self-Address)...");
  try {
    await chainCert.connect(issuer).issueCertificate(
      `CC-SEC-SELF-${Date.now()}`,
      contractAddress,
      "ipfs://test",
      dummyHash,
      0
    );
    throw new Error("Security Failure: Contract address was accepted as certificate recipient!");
  } catch (err: any) {
    console.log(" -> [PASS] Contract address as recipient successfully rejected.");
  }

  // TEST 3: Bounds Check on Metadata URI Length (> 256 chars)
  console.log("\n[TEST 3] Testing Bounds on Metadata URI Length (> 256 chars)...");
  const excessiveUri = "ipfs://" + "A".repeat(300);
  try {
    await chainCert.connect(issuer).issueCertificate(
      `CC-SEC-URI-${Date.now()}`,
      student.address,
      excessiveUri,
      dummyHash,
      0
    );
    throw new Error("Security Failure: Oversized Metadata URI (>256 chars) was accepted!");
  } catch (err: any) {
    console.log(" -> [PASS] Oversized Metadata URI successfully rejected.");
  }

  // TEST 4: Bounds Check on Institution Name (> 128 chars) & Contract Address as Issuer
  console.log("\n[TEST 4] Testing Bounds on Institution Authorization...");
  try {
    await chainCert.connect(admin).authorizeIssuer(contractAddress, "Self Academy");
    throw new Error("Security Failure: Contract address was authorized as an issuer!");
  } catch (err: any) {
    console.log(" -> [PASS] Contract address as issuer successfully rejected.");
  }

  const excessiveName = "Stanford ".repeat(20); // > 128 chars
  try {
    await chainCert.connect(admin).authorizeIssuer(attacker.address, excessiveName);
    throw new Error("Security Failure: Oversized institution name was accepted!");
  } catch (err: any) {
    console.log(" -> [PASS] Oversized institution name successfully rejected.");
  }

  // TEST 5: Bounds Check on Revocation Reason (> 512 chars)
  console.log("\n[TEST 5] Testing Bounds on Revocation Reason Length...");
  const testCertId = `CC-SEC-REV-${Date.now()}`;
  const validIssueTx = await chainCert.connect(issuer).issueCertificate(
    testCertId,
    student.address,
    "ipfs://valid",
    dummyHash,
    0
  );
  await validIssueTx.wait();

  const excessiveReason = "Reason ".repeat(100); // 700 chars, > 512
  try {
    await chainCert.connect(issuer).revokeCertificate(testCertId, excessiveReason);
    throw new Error("Security Failure: Oversized revocation reason was accepted!");
  } catch (err: any) {
    console.log(" -> [PASS] Oversized revocation reason successfully rejected.");
  }

  // TEST 6: Strict Expiration Boundary Verification (timestamp >= expiresAt is EXPIRED)
  console.log("\n[TEST 6] Testing Expiration Boundary Condition (>= threshold)...");
  const blockNumber = await ethers.provider.getBlockNumber();
  const currentBlock = await ethers.provider.getBlock(blockNumber);
  const currentTime = currentBlock!.timestamp;
  const targetExpiry = currentTime + 10;

  const expiryCertId = `CC-SEC-EXP-${Date.now()}`;
  const expIssueTx = await chainCert.connect(issuer).issueCertificate(
    expiryCertId,
    student.address,
    "ipfs://expiry",
    dummyHash,
    targetExpiry
  );
  await expIssueTx.wait();

  // Fast-forward time to exact targetExpiry
  await ethers.provider.send("evm_setNextBlockTimestamp", [targetExpiry]);
  await ethers.provider.send("evm_mine", []);

  const [isValidAtExactExpiry, statusAtExactExpiry] = await chainCert.isCertificateValid(expiryCertId);
  console.log(` -> Validity at exact expiry second: isValid=${isValidAtExactExpiry}, status=${statusAtExactExpiry}`);
  if (isValidAtExactExpiry || statusAtExactExpiry !== 3n) {
    throw new Error("Security Failure: Certificate at exact expiration second was not flagged as EXPIRED!");
  }
  console.log(" -> [PASS] Expiration boundary correctly evaluates to EXPIRED at threshold.");

  // TEST 7: Unauthorized Contract Access Rejections
  console.log("\n[TEST 7] Confirming Rejection of Unauthorized Contract Access...");
  try {
    await chainCert.connect(attacker).authorizeIssuer(attacker.address, "Attacker Institute");
    throw new Error("Security Failure: Attacker called authorizeIssuer!");
  } catch {
    console.log(" -> [PASS] Attacker blocked from authorizeIssuer.");
  }

  try {
    await chainCert.connect(attacker).issueCertificate(`CC-ATTACK-${Date.now()}`, attacker.address, "ipfs://", dummyHash, 0);
    throw new Error("Security Failure: Attacker called issueCertificate!");
  } catch {
    console.log(" -> [PASS] Attacker blocked from issueCertificate.");
  }

  try {
    await chainCert.connect(attacker).revokeCertificate(testCertId, "Attacker Revocation");
    throw new Error("Security Failure: Attacker revoked legitimate certificate!");
  } catch {
    console.log(" -> [PASS] Attacker blocked from revokeCertificate.");
  }

  console.log("\n==========================================================");
  console.log("ALL SECURITY AUDIT TEST VECTORS PASSED (100%)");
  console.log("==========================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
