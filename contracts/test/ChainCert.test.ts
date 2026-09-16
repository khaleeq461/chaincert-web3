import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ChainCert } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ChainCert Smart Contract Test Suite", function () {
  let chainCert: ChainCert;
  let admin: HardhatEthersSigner;
  let issuer1: HardhatEthersSigner;
  let issuer2: HardhatEthersSigner;
  let student1: HardhatEthersSigner;
  let student2: HardhatEthersSigner;
  let unauthorizedUser: HardhatEthersSigner;

  // Status Enum matches IChainCert.Status
  const Status = {
    NOT_FOUND: 0,
    VERIFIED: 1,
    REVOKED: 2,
    EXPIRED: 3,
  };

  const sampleCertId = "CC-2026-000001";
  const sampleCertId2 = "CC-2026-000002";
  const sampleMetadataURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("canonical-certificate-metadata-payload-1"));
  const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("canonical-certificate-metadata-payload-2"));
  const zeroHash = ethers.ZeroHash;
  const zeroAddress = ethers.ZeroAddress;

  beforeEach(async function () {
    [admin, issuer1, issuer2, student1, student2, unauthorizedUser] = await ethers.getSigners();

    const ChainCertFactory = await ethers.getContractFactory("ChainCert");
    chainCert = await ChainCertFactory.deploy(admin.address);
    await chainCert.waitForDeployment();
  });

  // =========================================================================
  // 1. INITIALIZATION & ROLES
  // =========================================================================
  describe("1. Initialization & Role Setup", function () {
    it("should deploy with initial admin holding DEFAULT_ADMIN_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = await chainCert.DEFAULT_ADMIN_ROLE();
      expect(await chainCert.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await chainCert.hasRole(DEFAULT_ADMIN_ROLE, unauthorizedUser.address)).to.be.false;
    });

    it("should revert deployment if admin is zero address", async function () {
      const ChainCertFactory = await ethers.getContractFactory("ChainCert");
      await expect(ChainCertFactory.deploy(zeroAddress)).to.be.revertedWithCustomError(
        chainCert,
        "ZeroAddressNotAllowed"
      );
    });

    it("should have total certificates and total issuers initialized to 0", async function () {
      expect(await chainCert.totalCertificates()).to.equal(0);
      expect(await chainCert.totalIssuers()).to.equal(0);
      const stats = await chainCert.getPlatformStats();
      expect(stats.totalCertificates).to.equal(0);
      expect(stats.totalIssuers).to.equal(0);
      expect(stats.activeCertificates).to.equal(0);
      expect(stats.revokedCertificates).to.equal(0);
    });
  });

  // =========================================================================
  // 2. ISSUER MANAGEMENT & AUTHORIZATION
  // =========================================================================
  describe("2. Issuer Authorization & Deactivation", function () {
    it("should allow admin to authorize an institution and emit IssuerAuthorized", async function () {
      await expect(chainCert.connect(admin).authorizeIssuer(issuer1.address, "Harvard Web3 Institute"))
        .to.emit(chainCert, "IssuerAuthorized")
        .withArgs(issuer1.address, "Harvard Web3 Institute", (timestamp: bigint) => timestamp > 0n);

      expect(await chainCert.isIssuerAuthorized(issuer1.address)).to.be.true;
      expect(await chainCert.getInstitutionName(issuer1.address)).to.equal("Harvard Web3 Institute");
      expect(await chainCert.totalIssuers()).to.equal(1);

      const issuers = await chainCert.getAllIssuers();
      expect(issuers).to.deep.equal([issuer1.address]);
    });

    it("should prevent non-admin from authorizing an issuer", async function () {
      const DEFAULT_ADMIN_ROLE = await chainCert.DEFAULT_ADMIN_ROLE();
      await expect(
        chainCert.connect(unauthorizedUser).authorizeIssuer(issuer1.address, "Fake Academy")
      ).to.be.revertedWithCustomError(chainCert, "AccessControlUnauthorizedAccount")
        .withArgs(unauthorizedUser.address, DEFAULT_ADMIN_ROLE);
    });

    it("should revert when authorizing zero address", async function () {
      await expect(
        chainCert.connect(admin).authorizeIssuer(zeroAddress, "Valid Name")
      ).to.be.revertedWithCustomError(chainCert, "ZeroAddressNotAllowed");
    });

    it("should revert when authorizing with empty institution name", async function () {
      await expect(
        chainCert.connect(admin).authorizeIssuer(issuer1.address, "")
      ).to.be.revertedWithCustomError(chainCert, "InvalidInstitutionName");
    });

    it("should revert when authorizing an already authorized issuer", async function () {
      await chainCert.connect(admin).authorizeIssuer(issuer1.address, "Oxford Blockchain Academy");
      await expect(
        chainCert.connect(admin).authorizeIssuer(issuer1.address, "Oxford Blockchain Academy Duplicate")
      ).to.be.revertedWithCustomError(chainCert, "IssuerAlreadyAuthorized")
        .withArgs(issuer1.address);
    });

    it("should allow admin to deactivate an authorized issuer and emit IssuerRevoked", async function () {
      await chainCert.connect(admin).authorizeIssuer(issuer1.address, "Stanford Decentralized Systems");

      await expect(chainCert.connect(admin).deactivateIssuer(issuer1.address))
        .to.emit(chainCert, "IssuerRevoked")
        .withArgs(issuer1.address, (timestamp: bigint) => timestamp > 0n);

      expect(await chainCert.isIssuerAuthorized(issuer1.address)).to.be.false;
    });

    it("should prevent non-admin from deactivating an issuer", async function () {
      await chainCert.connect(admin).authorizeIssuer(issuer1.address, "Stanford Decentralized Systems");
      const DEFAULT_ADMIN_ROLE = await chainCert.DEFAULT_ADMIN_ROLE();

      await expect(
        chainCert.connect(unauthorizedUser).deactivateIssuer(issuer1.address)
      ).to.be.revertedWithCustomError(chainCert, "AccessControlUnauthorizedAccount")
        .withArgs(unauthorizedUser.address, DEFAULT_ADMIN_ROLE);
    });

    it("should revert when deactivating an issuer that is not currently authorized", async function () {
      await expect(
        chainCert.connect(admin).deactivateIssuer(issuer2.address)
      ).to.be.revertedWithCustomError(chainCert, "IssuerNotAuthorized")
        .withArgs(issuer2.address);
    });

    it("should revert when deactivating zero address", async function () {
      await expect(
        chainCert.connect(admin).deactivateIssuer(zeroAddress)
      ).to.be.revertedWithCustomError(chainCert, "ZeroAddressNotAllowed");
    });
  });

  // =========================================================================
  // 3. CERTIFICATE ISSUANCE & DATA VALIDATION
  // =========================================================================
  describe("3. Certificate Issuance & Validation", function () {
    beforeEach(async function () {
      await chainCert.connect(admin).authorizeIssuer(issuer1.address, "MIT Web3 Academy");
    });

    it("should allow authorized issuer to issue lifetime certificate (expiresAt = 0)", async function () {
      const tx = await chainCert.connect(issuer1).issueCertificate(
        sampleCertId,
        student1.address,
        sampleMetadataURI,
        sampleHash,
        0
      );

      await expect(tx)
        .to.emit(chainCert, "CertificateIssued")
        .withArgs(
          sampleCertId,
          student1.address,
          issuer1.address,
          sampleHash,
          sampleMetadataURI,
          (ts: bigint) => ts > 0n,
          0
        );

      expect(await chainCert.certificateExists(sampleCertId)).to.be.true;
      expect(await chainCert.totalCertificates()).to.equal(1);

      const cert = await chainCert.getCertificate(sampleCertId);
      expect(cert.certificateId).to.equal(sampleCertId);
      expect(cert.recipient).to.equal(student1.address);
      expect(cert.issuer).to.equal(issuer1.address);
      expect(cert.metadataURI).to.equal(sampleMetadataURI);
      expect(cert.certificateHash).to.equal(sampleHash);
      expect(cert.expiresAt).to.equal(0);
      expect(cert.revoked).to.be.false;
      expect(cert.revokedAt).to.equal(0);
      expect(cert.revocationReason).to.equal("");

      const [isValid, status] = await chainCert.isCertificateValid(sampleCertId);
      expect(isValid).to.be.true;
      expect(status).to.equal(Status.VERIFIED);
      expect(await chainCert.getCertificateStatusString(sampleCertId)).to.equal("VERIFIED");
    });

    it("should allow authorized issuer to issue certificate with future expiration", async function () {
      const currentTime = await time.latest();
      const futureExpiry = currentTime + 365 * 24 * 60 * 60; // 1 year ahead

      await chainCert.connect(issuer1).issueCertificate(
        sampleCertId,
        student1.address,
        sampleMetadataURI,
        sampleHash,
        futureExpiry
      );

      const cert = await chainCert.getCertificate(sampleCertId);
      expect(cert.expiresAt).to.equal(futureExpiry);

      const [isValid, status] = await chainCert.isCertificateValid(sampleCertId);
      expect(isValid).to.be.true;
      expect(status).to.equal(Status.VERIFIED);
    });

    it("should prevent unauthorized user from issuing a certificate", async function () {
      const ISSUER_ROLE = await chainCert.ISSUER_ROLE();
      await expect(
        chainCert.connect(unauthorizedUser).issueCertificate(
          sampleCertId,
          student1.address,
          sampleMetadataURI,
          sampleHash,
          0
        )
      ).to.be.revertedWithCustomError(chainCert, "AccessControlUnauthorizedAccount")
        .withArgs(unauthorizedUser.address, ISSUER_ROLE);
    });

    it("should prevent deactivated issuer from issuing new certificates", async function () {
      await chainCert.connect(admin).deactivateIssuer(issuer1.address);
      const ISSUER_ROLE = await chainCert.ISSUER_ROLE();

      await expect(
        chainCert.connect(issuer1).issueCertificate(
          sampleCertId,
          student1.address,
          sampleMetadataURI,
          sampleHash,
          0
        )
      ).to.be.revertedWithCustomError(chainCert, "AccessControlUnauthorizedAccount")
        .withArgs(issuer1.address, ISSUER_ROLE);
    });

    it("should reject duplicate certificate ID", async function () {
      await chainCert.connect(issuer1).issueCertificate(
        sampleCertId,
        student1.address,
        sampleMetadataURI,
        sampleHash,
        0
      );

      await expect(
        chainCert.connect(issuer1).issueCertificate(
          sampleCertId,
          student2.address,
          sampleMetadataURI,
          sampleHash,
          0
        )
      ).to.be.revertedWithCustomError(chainCert, "CertificateAlreadyExists")
        .withArgs(sampleCertId);
    });

    it("should reject empty certificate ID", async function () {
      await expect(
        chainCert.connect(issuer1).issueCertificate(
          "",
          student1.address,
          sampleMetadataURI,
          sampleHash,
          0
        )
      ).to.be.revertedWithCustomError(chainCert, "InvalidCertificateId");
    });

    it("should reject zero address recipient", async function () {
      await expect(
        chainCert.connect(issuer1).issueCertificate(
          sampleCertId,
          zeroAddress,
          sampleMetadataURI,
          sampleHash,
          0
        )
      ).to.be.revertedWithCustomError(chainCert, "InvalidRecipientAddress");
    });

    it("should reject empty metadata URI", async function () {
      await expect(
        chainCert.connect(issuer1).issueCertificate(
          sampleCertId,
          student1.address,
          "",
          sampleHash,
          0
        )
      ).to.be.revertedWithCustomError(chainCert, "InvalidMetadataURI");
    });

    it("should reject zero hash", async function () {
      await expect(
        chainCert.connect(issuer1).issueCertificate(
          sampleCertId,
          student1.address,
          sampleMetadataURI,
          zeroHash,
          0
        )
      ).to.be.revertedWithCustomError(chainCert, "InvalidCertificateHash");
    });

    it("should reject past or current expiration date", async function () {
      const currentTime = await time.latest();
      await expect(
        chainCert.connect(issuer1).issueCertificate(
          sampleCertId,
          student1.address,
          sampleMetadataURI,
          sampleHash,
          currentTime - 10
        )
      ).to.be.revertedWithCustomError(chainCert, "InvalidExpirationDate");
    });
  });

  // =========================================================================
  // 4. RETRIEVAL & INDEXING QUERIES
  // =========================================================================
  describe("4. Retrieval & Indexing Queries", function () {
    beforeEach(async function () {
      await chainCert.connect(admin).authorizeIssuer(issuer1.address, "MIT Web3 Academy");
      await chainCert.connect(admin).authorizeIssuer(issuer2.address, "Berkeley Blockchain Lab");

      await chainCert.connect(issuer1).issueCertificate(
        sampleCertId,
        student1.address,
        sampleMetadataURI,
        sampleHash,
        0
      );

      await chainCert.connect(issuer2).issueCertificate(
        sampleCertId2,
        student1.address,
        sampleMetadataURI,
        sampleHash2,
        0
      );
    });

    it("should retrieve full certificate struct for existing ID", async function () {
      const cert = await chainCert.getCertificate(sampleCertId);
      expect(cert.certificateId).to.equal(sampleCertId);
      expect(cert.recipient).to.equal(student1.address);
      expect(cert.issuer).to.equal(issuer1.address);
    });

    it("should revert getCertificate for nonexistent ID", async function () {
      await expect(chainCert.getCertificate("NONEXISTENT-999"))
        .to.be.revertedWithCustomError(chainCert, "CertificateDoesNotExist")
        .withArgs("NONEXISTENT-999");
    });

    it("should return false and NOT_FOUND for nonexistent certificate in isCertificateValid", async function () {
      const [isValid, status] = await chainCert.isCertificateValid("NONEXISTENT-999");
      expect(isValid).to.be.false;
      expect(status).to.equal(Status.NOT_FOUND);
      expect(await chainCert.getCertificateStatusString("NONEXISTENT-999")).to.equal("NOT_FOUND");
    });

    it("should return all certificate IDs ever registered", async function () {
      const ids = await chainCert.getAllCertificateIds();
      expect(ids).to.deep.equal([sampleCertId, sampleCertId2]);
    });

    it("should index certificates by issuer", async function () {
      expect(await chainCert.getCertificatesByIssuer(issuer1.address)).to.deep.equal([sampleCertId]);
      expect(await chainCert.getCertificatesByIssuer(issuer2.address)).to.deep.equal([sampleCertId2]);
      expect(await chainCert.getCertificatesByIssuer(unauthorizedUser.address)).to.deep.equal([]);
    });

    it("should index certificates by recipient", async function () {
      expect(await chainCert.getCertificatesByRecipient(student1.address)).to.deep.equal([
        sampleCertId,
        sampleCertId2,
      ]);
      expect(await chainCert.getCertificatesByRecipient(student2.address)).to.deep.equal([]);
    });
  });

  // =========================================================================
  // 5. CERTIFICATE REVOCATION LIFECYCLE
  // =========================================================================
  describe("5. Certificate Revocation", function () {
    beforeEach(async function () {
      await chainCert.connect(admin).authorizeIssuer(issuer1.address, "MIT Web3 Academy");
      await chainCert.connect(admin).authorizeIssuer(issuer2.address, "Berkeley Blockchain Lab");

      await chainCert.connect(issuer1).issueCertificate(
        sampleCertId,
        student1.address,
        sampleMetadataURI,
        sampleHash,
        0
      );
    });

    it("should allow the issuing institution to revoke certificate and emit CertificateRevoked", async function () {
      const reason = "Administrative correction: duplicate record issued";

      await expect(chainCert.connect(issuer1).revokeCertificate(sampleCertId, reason))
        .to.emit(chainCert, "CertificateRevoked")
        .withArgs(sampleCertId, issuer1.address, (ts: bigint) => ts > 0n, reason);

      const cert = await chainCert.getCertificate(sampleCertId);
      expect(cert.revoked).to.be.true;
      expect(cert.revokedAt).to.be.gt(0);
      expect(cert.revocationReason).to.equal(reason);

      const [isValid, status] = await chainCert.isCertificateValid(sampleCertId);
      expect(isValid).to.be.false;
      expect(status).to.equal(Status.REVOKED);
      expect(await chainCert.getCertificateStatusString(sampleCertId)).to.equal("REVOKED");
    });

    it("should allow platform administrator to revoke certificate for safety", async function () {
      const reason = "Platform policy violation enforcement";

      await expect(chainCert.connect(admin).revokeCertificate(sampleCertId, reason))
        .to.emit(chainCert, "CertificateRevoked")
        .withArgs(sampleCertId, admin.address, (ts: bigint) => ts > 0n, reason);

      const [isValid, status] = await chainCert.isCertificateValid(sampleCertId);
      expect(isValid).to.be.false;
      expect(status).to.equal(Status.REVOKED);
    });

    it("should prevent unauthorized stranger from revoking certificate", async function () {
      await expect(
        chainCert.connect(unauthorizedUser).revokeCertificate(sampleCertId, "Malicious attempt")
      ).to.be.revertedWithCustomError(chainCert, "UnauthorizedRevocation")
        .withArgs(unauthorizedUser.address);
    });

    it("should prevent a different authorized issuer from revoking another issuer's certificate", async function () {
      await expect(
        chainCert.connect(issuer2).revokeCertificate(sampleCertId, "Inter-issuer violation")
      ).to.be.revertedWithCustomError(chainCert, "UnauthorizedRevocation")
        .withArgs(issuer2.address);
    });

    it("should prevent revoking an already revoked certificate", async function () {
      await chainCert.connect(issuer1).revokeCertificate(sampleCertId, "Legitimate revocation 1");

      await expect(
        chainCert.connect(issuer1).revokeCertificate(sampleCertId, "Duplicate revocation attempt")
      ).to.be.revertedWithCustomError(chainCert, "CertificateAlreadyRevoked")
        .withArgs(sampleCertId);
    });

    it("should revert revocation if reason is empty", async function () {
      await expect(
        chainCert.connect(issuer1).revokeCertificate(sampleCertId, "")
      ).to.be.revertedWithCustomError(chainCert, "InvalidRevocationReason");
    });

    it("should revert revocation of nonexistent certificate", async function () {
      await expect(
        chainCert.connect(issuer1).revokeCertificate("NONEXISTENT", "Reason")
      ).to.be.revertedWithCustomError(chainCert, "CertificateDoesNotExist")
        .withArgs("NONEXISTENT");
    });
  });

  // =========================================================================
  // 6. EXPIRATION LIFECYCLE
  // =========================================================================
  describe("6. Expiration Lifecycle Handling", function () {
    const validityDuration = 30 * 24 * 60 * 60; // 30 days

    beforeEach(async function () {
      await chainCert.connect(admin).authorizeIssuer(issuer1.address, "MIT Web3 Academy");

      const currentTime = await time.latest();
      const expiresAt = currentTime + validityDuration;

      await chainCert.connect(issuer1).issueCertificate(
        sampleCertId,
        student1.address,
        sampleMetadataURI,
        sampleHash,
        expiresAt
      );
    });

    it("should report ACTIVE/VERIFIED before expiration threshold", async function () {
      // Advance by 10 days (still valid)
      await time.increase(10 * 24 * 60 * 60);

      const [isValid, status] = await chainCert.isCertificateValid(sampleCertId);
      expect(isValid).to.be.true;
      expect(status).to.equal(Status.VERIFIED);
      expect(await chainCert.getCertificateStatusString(sampleCertId)).to.equal("VERIFIED");
    });

    it("should automatically report EXPIRED after expiration threshold has elapsed", async function () {
      // Advance past the 30 days window (+ 2 days)
      await time.increase(32 * 24 * 60 * 60);

      const [isValid, status] = await chainCert.isCertificateValid(sampleCertId);
      expect(isValid).to.be.false;
      expect(status).to.equal(Status.EXPIRED);
      expect(await chainCert.getCertificateStatusString(sampleCertId)).to.equal("EXPIRED");
    });

    it("should prioritize REVOKED status over EXPIRED if certificate was revoked", async function () {
      await chainCert.connect(issuer1).revokeCertificate(sampleCertId, "Breach of conduct");

      // Advance past expiration
      await time.increase(35 * 24 * 60 * 60);

      const [isValid, status] = await chainCert.isCertificateValid(sampleCertId);
      expect(isValid).to.be.false;
      expect(status).to.equal(Status.REVOKED);
      expect(await chainCert.getCertificateStatusString(sampleCertId)).to.equal("REVOKED");
    });
  });

  // =========================================================================
  // 7. PLATFORM TELEMETRY & STATS
  // =========================================================================
  describe("7. Platform Telemetry & Aggregated Stats", function () {
    it("should maintain accurate platform metrics across operations", async function () {
      await chainCert.connect(admin).authorizeIssuer(issuer1.address, "Institute A");
      await chainCert.connect(admin).authorizeIssuer(issuer2.address, "Institute B");

      await chainCert.connect(issuer1).issueCertificate(sampleCertId, student1.address, sampleMetadataURI, sampleHash, 0);
      await chainCert.connect(issuer2).issueCertificate(sampleCertId2, student2.address, sampleMetadataURI, sampleHash2, 0);

      let stats = await chainCert.getPlatformStats();
      expect(stats.totalIssuers).to.equal(2);
      expect(stats.totalCertificates).to.equal(2);
      expect(stats.activeCertificates).to.equal(2);
      expect(stats.revokedCertificates).to.equal(0);

      // Revoke one
      await chainCert.connect(issuer1).revokeCertificate(sampleCertId, "Administrative audit");

      stats = await chainCert.getPlatformStats();
      expect(stats.totalCertificates).to.equal(2);
      expect(stats.activeCertificates).to.equal(1);
      expect(stats.revokedCertificates).to.equal(1);
    });
  });
});
