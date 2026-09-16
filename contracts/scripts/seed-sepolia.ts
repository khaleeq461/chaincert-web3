import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const contractAddress = "0x9B4D250C5F475dD7f28B57CE79495449f1bDb959";
  console.log("Seeding Sepolia Contract:", contractAddress);
  console.log("Using Signer:", signer.address);

  const ChainCert = await ethers.getContractFactory("ChainCert");
  const chainCert = ChainCert.attach(contractAddress).connect(signer) as any;

  // 1. Authorize Signer as Issuer so they can issue certificates immediately
  console.log("\n[1] Authorizing deployer as University Issuer on Sepolia...");
  const isAuth = await chainCert.isIssuerAuthorized(signer.address);
  if (!isAuth) {
    const authTx = await chainCert.authorizeIssuer(signer.address, "Cambridge Web3 Academy");
    console.log(" -> Auth Tx Hash:", authTx.hash);
    await authTx.wait();
    console.log(" -> [CONFIRMED] Issuer authorized on Ethereum Sepolia!");
  } else {
    console.log(" -> Already authorized as issuer.");
  }

  // 2. Issue initial demonstration certificate CC-2026-000001 on Sepolia
  console.log("\n[2] Issuing sample credential CC-2026-000001 on Sepolia...");
  const certId = "CC-2026-000001";
  const exists = await chainCert.certificateExists(certId);
  if (!exists) {
    const metadataURI = "ipfs://bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("ChainCert-Sample-Authentic-Credential"));
    const issueTx = await chainCert.issueCertificate(
      certId,
      signer.address, // Recipient
      metadataURI,
      docHash,
      0 // Lifetime
    );
    console.log(" -> Issue Tx Hash:", issueTx.hash);
    await issueTx.wait();
    console.log(" -> [CONFIRMED] Certificate CC-2026-000001 issued on Ethereum Sepolia!");
  } else {
    console.log(" -> CC-2026-000001 already exists on Sepolia.");
  }

  console.log("\n========================================================");
  console.log("SEPOLIA TESTNET SEEDING COMPLETE!");
  console.log("View on Sepolia Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log("========================================================");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
