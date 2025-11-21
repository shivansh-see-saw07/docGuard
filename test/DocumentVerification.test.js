const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentVerification", function () {
  let documentVerification;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const DocumentVerification = await ethers.getContractFactory("DocumentVerification");
    documentVerification = await DocumentVerification.deploy();
    await documentVerification.waitForDeployment();
  });

  describe("Document Registration", function () {
    it("Should register a new document", async function () {
      const name = "John Doe";
      const contactNumber = "1234567890";
      const address = "123 Main St";

      const tx = await documentVerification.connect(addr1).registerDocument(
        name,
        contactNumber,
        address
      );

      // Wait for the transaction to be mined
      await tx.wait();

      // Get the document hash
      const hash = await documentVerification.generateDocumentHash(
        name,
        contactNumber,
        address
      );

      // Get document details
      const details = await documentVerification.getDocumentDetails(hash);

      expect(details.name).to.equal(name);
      expect(details.contactNumber).to.equal(contactNumber);
      expect(details.address).to.equal(address);
      expect(details.owner).to.equal(addr1.address);
      expect(details.isVerified).to.equal(false);
    });

    it("Should not allow duplicate document registration", async function () {
      const name = "John Doe";
      const contactNumber = "1234567890";
      const address = "123 Main St";

      await documentVerification.connect(addr1).registerDocument(
        name,
        contactNumber,
        address
      );

      await expect(
        documentVerification.connect(addr1).registerDocument(
          name,
          contactNumber,
          address
        )
      ).to.be.revertedWith("Document already registered");
    });
  });

  describe("Document Verification", function () {
    it("Should verify a document", async function () {
      const name = "John Doe";
      const contactNumber = "1234567890";
      const address = "123 Main St";

      const tx = await documentVerification.connect(addr1).registerDocument(
        name,
        contactNumber,
        address
      );
      await tx.wait();

      const hash = await documentVerification.generateDocumentHash(
        name,
        contactNumber,
        address
      );

      await documentVerification.connect(addr2).verifyDocument(hash);

      const details = await documentVerification.getDocumentDetails(hash);
      expect(details.isVerified).to.equal(true);
    });

    it("Should not allow verification of non-existent document", async function () {
      const fakeHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      await expect(
        documentVerification.connect(addr1).verifyDocument(fakeHash)
      ).to.be.revertedWith("Document not found");
    });
  });
}); 