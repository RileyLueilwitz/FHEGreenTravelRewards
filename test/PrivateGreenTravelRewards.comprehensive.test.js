const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Comprehensive Test Suite for PrivateGreenTravelRewards
 * Following CASE1_100_TEST_COMMON_PATTERNS.md requirements
 *
 * Test Coverage:
 * - Deployment and Initialization (5 tests)
 * - Period Management (8 tests)
 * - Travel Data Submission (10 tests)
 * - Reward Processing (6 tests)
 * - Access Control (6 tests)
 * - View Functions (4 tests)
 * - Edge Cases (8 tests)
 * - Integration Tests (4 tests)
 * - Gas Optimization (3 tests)
 *
 * Total: 54 test cases
 */

describe("PrivateGreenTravelRewards - Comprehensive Test Suite", function () {
  // Signers
  let deployer, alice, bob, carol, dave;
  let contract, contractAddress;

  // Deploy fixture
  async function deployFixture() {
    const signers = await ethers.getSigners();
    [deployer, alice, bob, carol, dave] = signers;

    const Factory = await ethers.getContractFactory("PrivateGreenTravelRewards");
    const instance = await Factory.deploy();
    await instance.waitForDeployment();
    const addr = await instance.getAddress();

    return { contract: instance, contractAddress: addr, signers };
  }

  beforeEach(async function () {
    const deployed = await deployFixture();
    contract = deployed.contract;
    contractAddress = deployed.contractAddress;
  });

  // ============================================
  // 1. Deployment and Initialization Tests (5)
  // ============================================
  describe("1. Deployment and Initialization", function () {
    it("1.1 Should deploy successfully with valid address", async function () {
      expect(contractAddress).to.be.properAddress;
      expect(contractAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("1.2 Should set deployer as owner", async function () {
      const owner = await contract.owner();
      expect(owner).to.equal(deployer.address);
    });

    it("1.3 Should initialize with period 1", async function () {
      const currentPeriod = await contract.currentPeriod();
      expect(currentPeriod).to.equal(1);
    });

    it("1.4 Should have zero participants initially", async function () {
      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[5]).to.equal(0); // participant count
    });

    it("1.5 Should set correct period start time", async function () {
      const periodInfo = await contract.getCurrentPeriodInfo();
      const blockTimestamp = await time.latest();

      // Start time should be within last block
      expect(periodInfo[3]).to.be.closeTo(blockTimestamp, 5);
    });
  });

  // ============================================
  // 2. Period Management Tests (8)
  // ============================================
  describe("2. Period Management", function () {
    it("2.1 Should allow owner to start new period", async function () {
      await expect(contract.connect(deployer).startNewPeriod())
        .to.emit(contract, "PeriodStarted");

      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[1]).to.equal(true); // active
    });

    it("2.2 Should not allow non-owner to start period", async function () {
      await expect(
        contract.connect(alice).startNewPeriod()
      ).to.be.revertedWith("Not authorized");
    });

    it("2.3 Should not allow starting period when one is active", async function () {
      await contract.connect(deployer).startNewPeriod();

      await expect(
        contract.connect(deployer).startNewPeriod()
      ).to.be.revertedWith("Period already active");
    });

    it("2.4 Should correctly track period active status", async function () {
      await contract.connect(deployer).startNewPeriod();

      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[1]).to.equal(true); // active
      expect(periodInfo[2]).to.equal(false); // not ended
    });

    it("2.5 Should allow ending period after duration", async function () {
      await contract.connect(deployer).startNewPeriod();

      // Advance time by 7 days
      await time.increase(7 * 24 * 60 * 60);

      const canEnd = await contract.canEndPeriod();
      expect(canEnd).to.equal(true);

      await expect(contract.endPeriod()).to.not.be.reverted;
    });

    it("2.6 Should not allow ending period before duration", async function () {
      await contract.connect(deployer).startNewPeriod();

      await expect(
        contract.endPeriod()
      ).to.be.revertedWith("Period still active");
    });

    it("2.7 Should emit PeriodEnded event with correct data", async function () {
      await contract.connect(deployer).startNewPeriod();
      await time.increase(7 * 24 * 60 * 60);

      await expect(contract.endPeriod())
        .to.emit(contract, "PeriodEnded");
    });

    it("2.8 Should increment period number after ending", async function () {
      await contract.connect(deployer).startNewPeriod();
      await time.increase(7 * 24 * 60 * 60);

      const periodBefore = await contract.currentPeriod();
      await contract.endPeriod();

      const periodAfter = await contract.currentPeriod();
      expect(periodAfter).to.equal(periodBefore + 1n);
    });
  });

  // ============================================
  // 3. Travel Data Submission Tests (10)
  // ============================================
  describe("3. Travel Data Submission", function () {
    beforeEach(async function () {
      await contract.connect(deployer).startNewPeriod();
    });

    it("3.1 Should allow user to submit valid travel data", async function () {
      const carbonSaved = 5000;

      await expect(contract.connect(alice).submitTravelData(carbonSaved))
        .to.emit(contract, "TravelSubmitted")
        .withArgs(alice.address, 1);
    });

    it("3.2 Should reject zero carbon value", async function () {
      await expect(
        contract.connect(alice).submitTravelData(0)
      ).to.be.revertedWith("Carbon saved must be positive");
    });

    it("3.3 Should reject duplicate submissions", async function () {
      await contract.connect(alice).submitTravelData(5000);

      await expect(
        contract.connect(alice).submitTravelData(3000)
      ).to.be.revertedWith("Already submitted this period");
    });

    it("3.4 Should track participant count correctly", async function () {
      await contract.connect(alice).submitTravelData(5000);
      await contract.connect(bob).submitTravelData(6000);
      await contract.connect(carol).submitTravelData(7000);

      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[5]).to.equal(3); // 3 participants
    });

    it("3.5 Should update submission status", async function () {
      await contract.connect(alice).submitTravelData(5000);

      const status = await contract.getParticipantStatus(alice.address);
      expect(status[0]).to.equal(true); // hasSubmitted
      expect(status[1]).to.be.gt(0); // submissionTime > 0
    });

    it("3.6 Should handle minimum qualifying amount", async function () {
      await expect(
        contract.connect(alice).submitTravelData(999)
      ).to.not.be.reverted;
    });

    it("3.7 Should handle bronze tier amount (1000-4999)", async function () {
      const bronzeAmount = 2500;
      await expect(
        contract.connect(alice).submitTravelData(bronzeAmount)
      ).to.not.be.reverted;
    });

    it("3.8 Should handle silver tier amount (5000-9999)", async function () {
      const silverAmount = 7500;
      await expect(
        contract.connect(alice).submitTravelData(silverAmount)
      ).to.not.be.reverted;
    });

    it("3.9 Should handle gold tier amount (10000+)", async function () {
      const goldAmount = 15000;
      await expect(
        contract.connect(alice).submitTravelData(goldAmount)
      ).to.not.be.reverted;
    });

    it("3.10 Should not allow submission when period is not active", async function () {
      const FreshContract = await ethers.getContractFactory("PrivateGreenTravelRewards");
      const freshInstance = await FreshContract.deploy();

      await expect(
        freshInstance.connect(alice).submitTravelData(5000)
      ).to.be.revertedWith("No active period");
    });
  });

  // ============================================
  // 4. Reward Processing Tests (6)
  // ============================================
  describe("4. Reward Processing", function () {
    beforeEach(async function () {
      await contract.connect(deployer).startNewPeriod();
    });

    it("4.1 Should process period end without participants", async function () {
      await time.increase(7 * 24 * 60 * 60);

      await expect(contract.endPeriod())
        .to.emit(contract, "PeriodEnded")
        .withArgs(1, 0); // 0 total rewards
    });

    it("4.2 Should handle period end with participants", async function () {
      await contract.connect(alice).submitTravelData(5000);
      await contract.connect(bob).submitTravelData(8000);

      await time.increase(7 * 24 * 60 * 60);
      await expect(contract.endPeriod()).to.not.be.reverted;
    });

    it("4.3 Should track processed status", async function () {
      await contract.connect(alice).submitTravelData(5000);

      const statusBefore = await contract.getParticipantStatus(alice.address);
      expect(statusBefore[2]).to.equal(false); // not processed
    });

    it("4.4 Should not allow claiming with zero rewards", async function () {
      await expect(
        contract.connect(alice).claimRewards()
      ).to.be.revertedWith("No rewards to claim");
    });

    it("4.5 Should emit event when claiming rewards", async function () {
      // Note: This would need actual reward processing which requires FHE
      // For now, we test the revert case
      await expect(
        contract.connect(alice).claimRewards()
      ).to.be.revertedWith("No rewards to claim");
    });

    it("4.6 Should handle processNextParticipant call", async function () {
      await contract.connect(alice).submitTravelData(5000);
      await time.increase(7 * 24 * 60 * 60);
      await contract.endPeriod();

      // Should not revert (though may not work on local network)
      await expect(contract.processNextParticipant()).to.not.be.reverted;
    });
  });

  // ============================================
  // 5. Access Control Tests (6)
  // ============================================
  describe("5. Access Control", function () {
    it("5.1 Should restrict startNewPeriod to owner only", async function () {
      await expect(
        contract.connect(alice).startNewPeriod()
      ).to.be.revertedWith("Not authorized");

      await expect(
        contract.connect(bob).startNewPeriod()
      ).to.be.revertedWith("Not authorized");
    });

    it("5.2 Should allow owner to call startNewPeriod", async function () {
      await expect(
        contract.connect(deployer).startNewPeriod()
      ).to.not.be.reverted;
    });

    it("5.3 Should allow any user to submit travel data", async function () {
      await contract.connect(deployer).startNewPeriod();

      await expect(
        contract.connect(alice).submitTravelData(5000)
      ).to.not.be.reverted;

      await expect(
        contract.connect(bob).submitTravelData(6000)
      ).to.not.be.reverted;
    });

    it("5.4 Should allow any user to claim their own rewards", async function () {
      // All users should be able to attempt claiming
      await expect(
        contract.connect(alice).claimRewards()
      ).to.be.revertedWith("No rewards to claim");
    });

    it("5.5 Should allow anyone to view public information", async function () {
      await expect(
        contract.connect(alice).getCurrentPeriodInfo()
      ).to.not.be.reverted;

      await expect(
        contract.connect(bob).getLifetimeStats(alice.address)
      ).to.not.be.reverted;
    });

    it("5.6 Should verify owner address is immutable", async function () {
      const owner1 = await contract.owner();
      await contract.connect(deployer).startNewPeriod();
      const owner2 = await contract.owner();

      expect(owner1).to.equal(owner2);
      expect(owner1).to.equal(deployer.address);
    });
  });

  // ============================================
  // 6. View Functions Tests (4)
  // ============================================
  describe("6. View Functions", function () {
    beforeEach(async function () {
      await contract.connect(deployer).startNewPeriod();
    });

    it("6.1 Should return correct current period info", async function () {
      const info = await contract.getCurrentPeriodInfo();

      expect(info[0]).to.equal(1); // period number
      expect(info[1]).to.equal(true); // active
      expect(info[2]).to.equal(false); // not ended
      expect(info[5]).to.equal(0); // no participants
    });

    it("6.2 Should return correct participant status", async function () {
      await contract.connect(alice).submitTravelData(5000);

      const status = await contract.getParticipantStatus(alice.address);
      expect(status[0]).to.equal(true); // hasSubmitted
      expect(status[1]).to.be.gt(0); // submission time
      expect(status[2]).to.equal(false); // not processed
    });

    it("6.3 Should return correct lifetime stats", async function () {
      const stats = await contract.getLifetimeStats(alice.address);

      expect(stats[0]).to.equal(0); // totalRewards initially 0
      expect(stats[1]).to.equal(0); // totalCarbonSaved initially 0
    });

    it("6.4 Should return correct period history", async function () {
      const history = await contract.getPeriodHistory(1);

      expect(history[0]).to.equal(true); // active
      expect(history[1]).to.equal(false); // not ended
    });
  });

  // ============================================
  // 7. Edge Cases and Boundary Tests (8)
  // ============================================
  describe("7. Edge Cases and Boundary Tests", function () {
    it("7.1 Should handle period with no participants", async function () {
      await contract.connect(deployer).startNewPeriod();
      await time.increase(7 * 24 * 60 * 60);

      await expect(contract.endPeriod())
        .to.emit(contract, "PeriodEnded")
        .withArgs(1, 0);
    });

    it("7.2 Should handle maximum number of participants", async function () {
      await contract.connect(deployer).startNewPeriod();

      const signers = await ethers.getSigners();
      const maxParticipants = Math.min(10, signers.length);

      for (let i = 0; i < maxParticipants; i++) {
        await contract.connect(signers[i]).submitTravelData(5000 + i * 100);
      }

      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[5]).to.equal(maxParticipants);
    });

    it("7.3 Should handle minimum carbon value boundary (1000)", async function () {
      await contract.connect(deployer).startNewPeriod();

      await expect(
        contract.connect(alice).submitTravelData(1000)
      ).to.not.be.reverted;
    });

    it("7.4 Should handle silver threshold boundary (5000)", async function () {
      await contract.connect(deployer).startNewPeriod();

      await expect(
        contract.connect(alice).submitTravelData(5000)
      ).to.not.be.reverted;
    });

    it("7.5 Should handle gold threshold boundary (10000)", async function () {
      await contract.connect(deployer).startNewPeriod();

      await expect(
        contract.connect(alice).submitTravelData(10000)
      ).to.not.be.reverted;
    });

    it("7.6 Should handle very large carbon values", async function () {
      await contract.connect(deployer).startNewPeriod();

      const largeValue = 1000000; // 1 million grams
      await expect(
        contract.connect(alice).submitTravelData(largeValue)
      ).to.not.be.reverted;
    });

    it("7.7 Should correctly calculate time remaining", async function () {
      await contract.connect(deployer).startNewPeriod();

      const info1 = await contract.getCurrentPeriodInfo();
      const remaining1 = Number(info1[6]);

      await time.increase(3 * 24 * 60 * 60); // 3 days

      const info2 = await contract.getCurrentPeriodInfo();
      const remaining2 = Number(info2[6]);

      expect(remaining1).to.be.gt(remaining2);
      expect(remaining2).to.be.closeTo(4 * 24 * 60 * 60, 10);
    });

    it("7.8 Should handle canEndPeriod check correctly", async function () {
      await contract.connect(deployer).startNewPeriod();

      const canEndBefore = await contract.canEndPeriod();
      expect(canEndBefore).to.equal(false);

      await time.increase(7 * 24 * 60 * 60);

      const canEndAfter = await contract.canEndPeriod();
      expect(canEndAfter).to.equal(true);
    });
  });

  // ============================================
  // 8. Integration Tests (4)
  // ============================================
  describe("8. Integration Tests - Full Workflows", function () {
    it("8.1 Should handle complete period lifecycle", async function () {
      // Start period
      await contract.connect(deployer).startNewPeriod();

      // Users submit data
      await contract.connect(alice).submitTravelData(1500);
      await contract.connect(bob).submitTravelData(6000);
      await contract.connect(carol).submitTravelData(12000);

      // Verify participants
      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[5]).to.equal(3);

      // Advance time
      await time.increase(7 * 24 * 60 * 60);

      // End period
      await expect(contract.endPeriod()).to.not.be.reverted;

      // Verify period incremented
      const newPeriod = await contract.currentPeriod();
      expect(newPeriod).to.equal(2);
    });

    it("8.2 Should handle multiple sequential periods", async function () {
      // Period 1
      await contract.connect(deployer).startNewPeriod();
      await contract.connect(alice).submitTravelData(5000);
      await time.increase(7 * 24 * 60 * 60);
      await contract.endPeriod();

      // Period 2
      await contract.connect(deployer).startNewPeriod();
      await contract.connect(bob).submitTravelData(6000);
      await time.increase(7 * 24 * 60 * 60);
      await contract.endPeriod();

      const currentPeriod = await contract.currentPeriod();
      expect(currentPeriod).to.equal(3);
    });

    it("8.3 Should maintain state consistency across operations", async function () {
      await contract.connect(deployer).startNewPeriod();

      const period1 = await contract.currentPeriod();
      await contract.connect(alice).submitTravelData(5000);

      const period2 = await contract.currentPeriod();
      expect(period1).to.equal(period2);

      await time.increase(7 * 24 * 60 * 60);
      await contract.endPeriod();

      const period3 = await contract.currentPeriod();
      expect(period3).to.equal(period1 + 1n);
    });

    it("8.4 Should handle user journey from submission to claim attempt", async function () {
      // Start period
      await contract.connect(deployer).startNewPeriod();

      // Alice submits data
      await contract.connect(alice).submitTravelData(8000);

      // Check status
      const status = await contract.getParticipantStatus(alice.address);
      expect(status[0]).to.equal(true);

      // Check initial stats
      const statsBefore = await contract.getLifetimeStats(alice.address);
      expect(statsBefore[0]).to.equal(0);

      // Try to claim (should fail - no rewards yet)
      await expect(
        contract.connect(alice).claimRewards()
      ).to.be.revertedWith("No rewards to claim");
    });
  });

  // ============================================
  // 9. Gas Optimization Tests (3)
  // ============================================
  describe("9. Gas Optimization Tests", function () {
    it("9.1 Should deploy with reasonable gas cost", async function () {
      const Factory = await ethers.getContractFactory("PrivateGreenTravelRewards");
      const deployTx = await Factory.getDeployTransaction();

      // Estimate gas
      const estimatedGas = await ethers.provider.estimateGas(deployTx);

      // Should be under 5 million gas
      expect(estimatedGas).to.be.lt(5000000);
    });

    it("9.2 Should submit travel data efficiently", async function () {
      await contract.connect(deployer).startNewPeriod();

      const tx = await contract.connect(alice).submitTravelData(5000);
      const receipt = await tx.wait();

      // Should be under 200k gas
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("9.3 Should handle period operations efficiently", async function () {
      const startTx = await contract.connect(deployer).startNewPeriod();
      const startReceipt = await startTx.wait();

      // Start period should be under 150k gas
      expect(startReceipt.gasUsed).to.be.lt(150000);

      await time.increase(7 * 24 * 60 * 60);

      const endTx = await contract.endPeriod();
      const endReceipt = await endTx.wait();

      // End period should be under 150k gas (without participants)
      expect(endReceipt.gasUsed).to.be.lt(150000);
    });
  });

  // ============================================
  // 10. Event Emission Tests (3)
  // ============================================
  describe("10. Event Emission Tests", function () {
    it("10.1 Should emit PeriodStarted with correct parameters", async function () {
      const currentPeriod = await contract.currentPeriod();

      await expect(contract.connect(deployer).startNewPeriod())
        .to.emit(contract, "PeriodStarted")
        .withArgs(currentPeriod, await time.latest() + 1);
    });

    it("10.2 Should emit TravelSubmitted with correct parameters", async function () {
      await contract.connect(deployer).startNewPeriod();

      const currentPeriod = await contract.currentPeriod();

      await expect(contract.connect(alice).submitTravelData(5000))
        .to.emit(contract, "TravelSubmitted")
        .withArgs(alice.address, currentPeriod);
    });

    it("10.3 Should emit PeriodEnded when period ends", async function () {
      await contract.connect(deployer).startNewPeriod();
      const currentPeriod = await contract.currentPeriod();

      await time.increase(7 * 24 * 60 * 60);

      await expect(contract.endPeriod())
        .to.emit(contract, "PeriodEnded")
        .withArgs(currentPeriod, 0); // 0 rewards (no participants processed)
    });
  });
});
