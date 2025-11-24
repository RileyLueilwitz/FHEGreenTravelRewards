const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivacyGateway", function () {
  let privacyGateway;
  let owner, gateway1, gateway2, requester1, requester2;
  const encryptedData = ethers.toBeHex("0x1234567890abcdef");
  const amount = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, gateway1, gateway2, requester1, requester2] = await ethers.getSigners();

    const PrivacyGateway = await ethers.getContractFactory("PrivacyGateway");
    privacyGateway = await PrivacyGateway.deploy();
    await privacyGateway.waitForDeployment();

    // Approve gateways
    await privacyGateway.approveGateway(gateway1.address);
    await privacyGateway.approveGateway(gateway2.address);
  });

  describe("Gateway Management", function () {
    it("Should approve a gateway", async function () {
      expect(await privacyGateway.approvedGateways(gateway1.address)).to.be.true;
    });

    it("Should revoke a gateway", async function () {
      await privacyGateway.revokeGateway(gateway1.address);
      expect(await privacyGateway.approvedGateways(gateway1.address)).to.be.false;
    });

    it("Should not approve gateway twice", async function () {
      await expect(privacyGateway.approveGateway(gateway1.address)).to.be.revertedWith(
        "Gateway already approved"
      );
    });

    it("Should get all approved gateways", async function () {
      const gateways = await privacyGateway.getApprovedGateways();
      expect(gateways.length).to.equal(2);
      expect(gateways[0]).to.equal(gateway1.address);
    });
  });

  describe("Decryption Requests", function () {
    it("Should create a decryption request", async function () {
      const mockCallback = owner.address;
      const tx = await privacyGateway.connect(requester1).submitDecryptionRequest(
        encryptedData,
        mockCallback,
        0,
        { value: amount }
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should not create request without payment", async function () {
      await expect(
        privacyGateway.connect(requester1).submitDecryptionRequest(
          encryptedData,
          owner.address,
          0,
          { value: 0 }
        )
      ).to.be.revertedWith("Must send ETH for request");
    });

    it("Should not create request with empty encrypted data", async function () {
      await expect(
        privacyGateway.connect(requester1).submitDecryptionRequest(
          "0x",
          owner.address,
          0,
          { value: amount }
        )
      ).to.be.revertedWith("Encrypted data cannot be empty");
    });

    it("Should reject invalid timeout duration", async function () {
      const tooShortTimeout = 1; // Less than minTimeout
      await expect(
        privacyGateway.connect(requester1).submitDecryptionRequest(
          encryptedData,
          owner.address,
          tooShortTimeout,
          { value: amount }
        )
      ).to.be.revertedWith("Invalid timeout duration");
    });
  });

  describe("Timeout Protection", function () {
    it("Should detect timeout correctly", async function () {
      const mockCallback = owner.address;
      const tx = await privacyGateway.connect(requester1).submitDecryptionRequest(
        encryptedData,
        mockCallback,
        3600, // 1 hour
        { value: amount }
      );

      const receipt = await tx.wait();
      const requestId = receipt.logs[0]?.topics[1];

      // Initially not timed out
      const isTimedOut1 = await privacyGateway.isRequestTimedOut(requestId);
      expect(isTimedOut1).to.be.false;

      // Advance time past timeout
      await ethers.provider.send("hardhat_mine", ["0x1000"]); // Mine many blocks
      await ethers.provider.send("evm_increaseTime", [7200]); // 2 hours

      // Should be timed out now
      const isTimedOut2 = await privacyGateway.isRequestTimedOut(requestId);
      expect(isTimedOut2).to.be.true;
    });

    it("Should force timeout on expired request", async function () {
      const mockCallback = owner.address;
      const tx = await privacyGateway.connect(requester1).submitDecryptionRequest(
        encryptedData,
        mockCallback,
        1800, // 30 minutes
        { value: amount }
      );

      const receipt = await tx.wait();
      const requestId = receipt.logs[0]?.topics[1];

      // Advance time
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("hardhat_mine", ["0x1"]);

      // Force timeout
      const forceTx = await privacyGateway.forceTimeout(requestId);
      await forceTx.wait();

      const request = await privacyGateway.getRequest(requestId);
      expect(request.status).to.equal(3); // FAILED status
    });
  });

  describe("Refund Mechanism", function () {
    it("Should refund on failed decryption", async function () {
      const mockCallback = owner.address;
      const initialBalance = await ethers.provider.getBalance(requester1.address);

      const tx = await privacyGateway.connect(requester1).submitDecryptionRequest(
        encryptedData,
        mockCallback,
        0,
        { value: amount }
      );

      const receipt = await tx.wait();
      const requestId = receipt.logs[0]?.topics[1];

      // Claim refund
      const refundTx = await privacyGateway.connect(requester1).claimRefund(requestId);
      const refundReceipt = await refundTx.wait();
      const refundGas = refundReceipt.gasUsed * refundReceipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(requester1.address);

      // Should recover most of the sent amount (minus gas)
      expect(finalBalance).to.be.closeTo(initialBalance - refundGas, ethers.parseEther("0.01"));
    });

    it("Should not allow refund twice", async function () {
      const mockCallback = owner.address;
      const tx = await privacyGateway.connect(requester1).submitDecryptionRequest(
        encryptedData,
        mockCallback,
        0,
        { value: amount }
      );

      const receipt = await tx.wait();
      const requestId = receipt.logs[0]?.topics[1];

      await privacyGateway.connect(requester1).claimRefund(requestId);

      await expect(
        privacyGateway.connect(requester1).claimRefund(requestId)
      ).to.be.revertedWith("Already refunded");
    });

    it("Should not allow non-requester to claim refund", async function () {
      const mockCallback = owner.address;
      const tx = await privacyGateway.connect(requester1).submitDecryptionRequest(
        encryptedData,
        mockCallback,
        0,
        { value: amount }
      );

      const receipt = await tx.wait();
      const requestId = receipt.logs[0]?.topics[1];

      await expect(
        privacyGateway.connect(requester2).claimRefund(requestId)
      ).to.be.revertedWith("Only requester can call");
    });
  });

  describe("Decryption Completion", function () {
    it("Should update request status on completion", async function () {
      const MockCallback = await ethers.getContractFactory("MockCallback");
      const mockCallback = await MockCallback.deploy();
      await mockCallback.waitForDeployment();

      const tx = await privacyGateway.connect(requester1).submitDecryptionRequest(
        encryptedData,
        mockCallback.target,
        0,
        { value: amount }
      );

      const receipt = await tx.wait();
      const requestId = receipt.logs[0]?.topics[1];

      // Gateway completes decryption
      const completeTx = await privacyGateway.connect(gateway1).completeDecryption(
        requestId,
        ethers.toBeHex("0xdecrypted")
      );

      await completeTx.wait();

      const request = await privacyGateway.getRequest(requestId);
      expect(request.status).to.equal(2); // COMPLETED status
    });
  });

  describe("Pause/Unpause", function () {
    it("Should pause and unpause the contract", async function () {
      await privacyGateway.pause();
      const paused = await privacyGateway.paused();
      expect(paused).to.be.true;

      await expect(
        privacyGateway.connect(requester1).submitDecryptionRequest(
          encryptedData,
          owner.address,
          0,
          { value: amount }
        )
      ).to.be.revertedWith("Pausable: paused");

      await privacyGateway.unpause();
      const unpaused = await privacyGateway.paused();
      expect(unpaused).to.be.false;
    });
  });

  describe("Timeout Configuration", function () {
    it("Should update default timeout", async function () {
      const newTimeout = 48 * 3600; // 48 hours
      await privacyGateway.setDefaultTimeout(newTimeout);

      expect(await privacyGateway.defaultTimeoutDuration()).to.equal(newTimeout);
    });

    it("Should update timeout constraints", async function () {
      const newMin = 2 * 3600; // 2 hours
      const newMax = 14 * 86400; // 14 days
      await privacyGateway.setTimeoutConstraints(newMin, newMax);

      expect(await privacyGateway.minTimeout()).to.equal(newMin);
      expect(await privacyGateway.maxTimeout()).to.equal(newMax);
    });
  });

  describe("Gateway Balance", function () {
    it("Should track gateway balance", async function () {
      const mockCallback = owner.address;
      const tx = await privacyGateway.connect(requester1).submitDecryptionRequest(
        encryptedData,
        mockCallback,
        0,
        { value: amount }
      );

      const receipt = await tx.wait();
      const requestId = receipt.logs[0]?.topics[1];

      // Complete decryption manually
      await privacyGateway.connect(gateway1).completeDecryption(
        requestId,
        ethers.toBeHex("0xdecrypted")
      );

      // Gateway should have balance
      const balance = await privacyGateway.getGatewayBalance(gateway1.address);
      expect(balance).to.be.gt(0);
    });

    it("Should withdraw gateway balance", async function () {
      const mockCallback = owner.address;
      const tx = await privacyGateway.connect(requester1).submitDecryptionRequest(
        encryptedData,
        mockCallback,
        0,
        { value: amount }
      );

      const receipt = await tx.wait();
      const requestId = receipt.logs[0]?.topics[1];

      await privacyGateway.connect(gateway1).completeDecryption(
        requestId,
        ethers.toBeHex("0xdecrypted")
      );

      const initialBalance = await ethers.provider.getBalance(gateway1.address);

      const withdrawTx = await privacyGateway.connect(gateway1).withdrawGatewayBalance(
        gateway1.address
      );
      const withdrawReceipt = await withdrawTx.wait();
      const gas = withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(gateway1.address);
      expect(finalBalance).to.be.closeTo(initialBalance + amount - gas, ethers.parseEther("0.01"));
    });
  });
});

// Mock callback contract for testing
const MockCallbackCode = `
pragma solidity ^0.8.0;

import "./interfaces/IGatewayCallback.sol";

contract MockCallback is IGatewayCallback {
    function onDecryptionComplete(
        bytes32 requestId,
        address requester,
        bytes calldata encryptedData,
        bytes calldata decryptedData
    ) external override returns (bool) {
        return true;
    }
}
`;
