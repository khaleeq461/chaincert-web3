import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer, demoIssuer, demoRecipient] = await ethers.getSigners();

  console.log("==========================================");
  console.log("Deploying ChainCert Registry");
  console.log("Network:", network.name, "(Chain ID:", (await ethers.provider.getNetwork()).chainId, ")");
  console.log("Deployer Address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");
  console.log("==========================================");

  const ChainCert = await ethers.getContractFactory("ChainCert");
  const chainCert = await ChainCert.deploy(deployer.address);
  await chainCert.waitForDeployment();

  const contractAddress = await chainCert.getAddress();
  console.log("ChainCert contract deployed to:", contractAddress);
  console.log("Admin initialized to:", deployer.address);

  // If local or hardhat, seed initial demo institution and certificate
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("------------------------------------------");
    console.log("Seeding Demo Test Data for Capstone Defense...");

    const institutionName = "Global Web3 Institute";
    const issuerAddress = demoIssuer ? demoIssuer.address : deployer.address;
    const recipientAddress = demoRecipient ? demoRecipient.address : deployer.address;

    // 1. Authorize issuer
    const authTx = await chainCert.authorizeIssuer(issuerAddress, institutionName);
    await authTx.wait();
    console.log(`[SEED] Authorized Issuer (${institutionName}):`, issuerAddress);

    // 2. Issue demo certificate
    const demoCertId = "CC-2026-000001";
    const demoMetadataURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
    const demoHash = ethers.keccak256(ethers.toUtf8Bytes("demo-canonical-cert-payload"));
    const expiresAt = 0; // Lifetime

    const issuerSigner = demoIssuer ? demoIssuer : deployer;
    const issueTx = await chainCert.connect(issuerSigner).issueCertificate(
      demoCertId,
      recipientAddress,
      demoMetadataURI,
      demoHash,
      expiresAt
    );
    await issueTx.wait();
    console.log(`[SEED] Issued Certificate (${demoCertId}) to:`, recipientAddress);

    const [isValid, status] = await chainCert.isCertificateValid(demoCertId);
    console.log(`[SEED] Verification Check for ${demoCertId}: Valid = ${isValid}, Status = ${status} (VERIFIED)`);
  }

  // Save deployment metadata
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    address: contractAddress,
    admin: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const deploymentFilePath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentData, null, 2));
  console.log("Deployment information saved to:", deploymentFilePath);
  console.log("==========================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
