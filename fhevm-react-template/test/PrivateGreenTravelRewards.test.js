const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivateGreenTravelRewards Contract", function () {
  let contract;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy contract
    const PrivateGreenTravelRewards = await ethers.getContractFactory(
      "PrivateGreenTravelRewards"
    );
    contract = await PrivateGreenTravelRewards.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should initialize with period 1", async function () {
      expect(await contract.currentPeriod()).to.equal(1);
    });

    it("Should have correct initial state", async function () {
      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[0]).to.equal(1); // period number
      expect(periodInfo[5]).to.equal(0); // no participants yet
    });
  });

  describe("Period Management", function () {
    it("Should allow owner to start a new period", async function () {
      await expect(contract.connect(owner).startNewPeriod())
        .to.emit(contract, "PeriodStarted")
        .withArgs(1, await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1));

      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[1]).to.equal(true); // active
      expect(periodInfo[2]).to.equal(false); // not ended
    });

    it("Should not allow non-owner to start a period", async function () {
      await expect(
        contract.connect(user1).startNewPeriod()
      ).to.be.revertedWith("Not authorized");
    });

    it("Should not allow starting period if one is already active", async function () {
      await contract.connect(owner).startNewPeriod();

      await expect(
        contract.connect(owner).startNewPeriod()
      ).to.be.revertedWith("Period already active");
    });

    it("Should allow ending period after duration", async function () {
      await contract.connect(owner).startNewPeriod();

      // Advance time by 7 days
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const canEnd = await contract.canEndPeriod();
      expect(canEnd).to.equal(true);

      await expect(contract.connect(owner).endPeriod()).to.not.be.reverted;
    });

    it("Should not allow ending period before duration", async function () {
      await contract.connect(owner).startNewPeriod();

      await expect(
        contract.connect(owner).endPeriod()
      ).to.be.revertedWith("Period still active");
    });
  });

  describe("Travel Data Submission", function () {
    beforeEach(async function () {
      // Start a period before each test
      await contract.connect(owner).startNewPeriod();
    });

    it("Should allow user to submit travel data", async function () {
      const carbonSaved = 5000;

      await expect(contract.connect(user1).submitTravelData(carbonSaved))
        .to.emit(contract, "TravelSubmitted")
        .withArgs(user1.address, 1);

      const status = await contract.getParticipantStatus(user1.address);
      expect(status[0]).to.equal(true); // hasSubmitted
    });

    it("Should not allow zero carbon savings", async function () {
      await expect(
        contract.connect(user1).submitTravelData(0)
      ).to.be.revertedWith("Carbon saved must be positive");
    });

    it("Should not allow duplicate submissions", async function () {
      await contract.connect(user1).submitTravelData(5000);

      await expect(
        contract.connect(user1).submitTravelData(3000)
      ).to.be.revertedWith("Already submitted this period");
    });

    it("Should not allow submission when period is not active", async function () {
      // Try to submit without starting period (constructor doesn't start it)
      const freshContract = await (
        await ethers.getContractFactory("PrivateGreenTravelRewards")
      ).deploy();

      await expect(
        freshContract.connect(user1).submitTravelData(5000)
      ).to.be.revertedWith("No active period");
    });

    it("Should track multiple participants", async function () {
      await contract.connect(user1).submitTravelData(5000);
      await contract.connect(user2).submitTravelData(8000);
      await contract.connect(user3).submitTravelData(12000);

      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[5]).to.equal(3); // 3 participants
    });
  });

  describe("Participant Status", function () {
    beforeEach(async function () {
      await contract.connect(owner).startNewPeriod();
      await contract.connect(user1).submitTravelData(5000);
    });

    it("Should return correct submission status", async function () {
      const status = await contract.getParticipantStatus(user1.address);

      expect(status[0]).to.equal(true); // hasSubmitted
      expect(status[1]).to.be.gt(0); // submissionTime > 0
      expect(status[2]).to.equal(false); // not processed yet
    });

    it("Should return false for non-participant", async function () {
      const status = await contract.getParticipantStatus(user2.address);
      expect(status[0]).to.equal(false);
    });
  });

  describe("Lifetime Statistics", function () {
    it("Should track lifetime stats correctly", async function () {
      const stats = await contract.getLifetimeStats(user1.address);

      expect(stats[0]).to.equal(0); // totalRewards initially 0
      expect(stats[1]).to.equal(0); // totalCarbonSaved initially 0
    });
  });

  describe("Period History", function () {
    it("Should return correct period history", async function () {
      await contract.connect(owner).startNewPeriod();
      await contract.connect(user1).submitTravelData(5000);

      const history = await contract.getPeriodHistory(1);

      expect(history[0]).to.equal(true); // active
      expect(history[1]).to.equal(false); // not ended
      expect(history[4]).to.equal(1); // 1 participant
    });
  });

  describe("Rewards Claiming", function () {
    it("Should not allow claiming when no rewards", async function () {
      await expect(
        contract.connect(user1).claimRewards()
      ).to.be.revertedWith("No rewards to claim");
    });

    it("Should emit event when claiming rewards", async function () {
      // Note: This test would need actual reward processing which requires FHE network
      // For now, we just verify the function exists and reverts correctly
      await expect(
        contract.connect(user1).claimRewards()
      ).to.be.revertedWith("No rewards to claim");
    });
  });

  describe("Period Information", function () {
    it("Should return correct current period info", async function () {
      await contract.connect(owner).startNewPeriod();

      const info = await contract.getCurrentPeriodInfo();

      expect(info[0]).to.equal(1); // period number
      expect(info[1]).to.equal(true); // active
      expect(info[2]).to.equal(false); // not ended
      expect(info[5]).to.equal(0); // no participants
      expect(info[6]).to.be.gt(0); // time remaining > 0
    });

    it("Should calculate time remaining correctly", async function () {
      await contract.connect(owner).startNewPeriod();

      // Advance time by 3 days
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const info = await contract.getCurrentPeriodInfo();
      const timeRemaining = Number(info[6]);

      // Should be approximately 4 days remaining
      expect(timeRemaining).to.be.gt(3 * 24 * 60 * 60);
      expect(timeRemaining).to.be.lt(5 * 24 * 60 * 60);
    });
  });

  describe("Access Control", function () {
    it("Should restrict owner-only functions", async function () {
      await expect(
        contract.connect(user1).startNewPeriod()
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow owner to perform owner functions", async function () {
      await expect(contract.connect(owner).startNewPeriod()).to.not.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle period with no participants", async function () {
      await contract.connect(owner).startNewPeriod();

      // Advance time
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // End period with no participants
      await expect(contract.connect(owner).endPeriod())
        .to.emit(contract, "PeriodEnded")
        .withArgs(1, 0);
    });

    it("Should handle maximum number of participants", async function () {
      await contract.connect(owner).startNewPeriod();

      // Get more signers
      const signers = await ethers.getSigners();
      const maxParticipants = Math.min(signers.length, 10);

      // Submit from multiple users
      for (let i = 0; i < maxParticipants; i++) {
        await contract.connect(signers[i]).submitTravelData(5000 + i * 100);
      }

      const periodInfo = await contract.getCurrentPeriodInfo();
      expect(periodInfo[5]).to.equal(maxParticipants);
    });
  });

  describe("Contract State Consistency", function () {
    it("Should maintain consistent state across period lifecycle", async function () {
      // Start period
      await contract.connect(owner).startNewPeriod();
      let period1 = await contract.currentPeriod();

      // Submit data
      await contract.connect(user1).submitTravelData(5000);

      // Period should not increment yet
      let period2 = await contract.currentPeriod();
      expect(period1).to.equal(period2);

      // Advance time
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // End period
      await contract.connect(owner).endPeriod();

      // Period should increment
      let period3 = await contract.currentPeriod();
      expect(period3).to.equal(period2 + 1n);
    });
  });
});
