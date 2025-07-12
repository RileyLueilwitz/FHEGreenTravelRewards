const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Simulate a complete reward period cycle
 * This script demonstrates the full workflow:
 * 1. Deploy contract (or connect to existing)
 * 2. Start a new period
 * 3. Multiple users submit travel data
 * 4. End the period
 * 5. Process rewards
 * 6. Display results
 *
 * Usage: node scripts/simulate.js [contract-address]
 */

async function main() {
  console.log("========================================");
  console.log("  Green Travel Rewards Simulation");
  console.log("========================================\n");

  let contract;
  let contractAddress;
  let isNewDeployment = false;

  // Check if contract address is provided
  if (process.argv.length >= 3) {
    contractAddress = process.argv[2];
    console.log("Connecting to existing contract:", contractAddress);

    const PrivateGreenTravelRewards = await ethers.getContractFactory(
      "PrivateGreenTravelRewards"
    );
    contract = PrivateGreenTravelRewards.attach(contractAddress);
  } else {
    // Deploy new contract for simulation
    console.log("No contract address provided. Deploying new contract...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const PrivateGreenTravelRewards = await ethers.getContractFactory(
      "PrivateGreenTravelRewards"
    );

    console.log("Deploying contract...");
    contract = await PrivateGreenTravelRewards.deploy();
    await contract.waitForDeployment();

    contractAddress = await contract.getAddress();
    isNewDeployment = true;

    console.log("✅ Contract deployed to:", contractAddress);
    console.log("");
  }

  // Get signers (simulate multiple users)
  const signers = await ethers.getSigners();
  const owner = signers[0];

  console.log("--- Simulation Configuration ---");
  console.log("Contract Address:", contractAddress);
  console.log("Owner:", owner.address);
  console.log("Available Test Accounts:", Math.min(signers.length, 5));
  console.log("");

  // Simulate participants with different carbon savings
  const participants = [
    { signer: signers[0], carbonSaved: 1500, name: "User 1 (Bronze Tier)" },
    { signer: signers[1], carbonSaved: 6000, name: "User 2 (Silver Tier)" },
    { signer: signers[2], carbonSaved: 12000, name: "User 3 (Gold Tier)" },
    { signer: signers[3], carbonSaved: 500, name: "User 4 (Below Min)" },
    { signer: signers[4], carbonSaved: 8500, name: "User 5 (Silver Tier)" },
  ].slice(0, Math.min(signers.length, 5));

  console.log("========================================");
  console.log("PHASE 1: Start New Period");
  console.log("========================================\n");

  try {
    const tx = await contract.connect(owner).startNewPeriod();
    await tx.wait();
    console.log("✅ Period started successfully");
    console.log("Transaction hash:", tx.hash);
  } catch (error) {
    if (error.message.includes("Period already active")) {
      console.log("ℹ️  Period is already active, continuing...");
    } else {
      throw error;
    }
  }

  const currentPeriod = await contract.currentPeriod();
  console.log("Current Period:", currentPeriod.toString());
  console.log("");

  console.log("========================================");
  console.log("PHASE 2: Participants Submit Travel Data");
  console.log("========================================\n");

  for (const participant of participants) {
    console.log(`${participant.name}`);
    console.log(`  Address: ${participant.signer.address}`);
    console.log(`  Carbon Saved: ${participant.carbonSaved} grams CO2e`);

    try {
      const tx = await contract
        .connect(participant.signer)
        .submitTravelData(participant.carbonSaved);

      console.log(`  Transaction: ${tx.hash}`);
      await tx.wait();
      console.log("  ✅ Submitted successfully\n");
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}\n`);
    }
  }

  // Display period status
  console.log("========================================");
  console.log("PHASE 3: Period Status");
  console.log("========================================\n");

  const periodInfo = await contract.getCurrentPeriodInfo();
  console.log("Period Number:", periodInfo[0].toString());
  console.log("Active:", periodInfo[1]);
  console.log("Ended:", periodInfo[2]);
  console.log("Total Participants:", periodInfo[5].toString());
  console.log("");

  console.log("========================================");
  console.log("PHASE 4: Simulate Time Passage");
  console.log("========================================\n");

  console.log("Advancing time by 7 days...");
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine");
  console.log("✅ Time advanced\n");

  const canEnd = await contract.canEndPeriod();
  console.log("Can end period:", canEnd);
  console.log("");

  if (!canEnd) {
    console.log("⚠️  Cannot end period yet. Skipping end period phase.");
    console.log("");
  } else {
    console.log("========================================");
    console.log("PHASE 5: End Period & Process Rewards");
    console.log("========================================\n");

    console.log("Ending period...");
    const endTx = await contract.connect(owner).endPeriod();
    console.log("Transaction hash:", endTx.hash);
    await endTx.wait();
    console.log("✅ Period ended - decryption initiated\n");

    // Note: In actual deployment, decryption happens via oracle callback
    // For simulation on local network, the processRewards callback won't work
    console.log("⚠️  Note: On local networks (Hardhat/Ganache), FHE decryption");
    console.log("   callbacks won't work. On testnet/mainnet, the oracle will");
    console.log("   automatically call processRewards() with decrypted values.\n");

    // Try to process participants (will only work on FHE-enabled networks)
    console.log("Attempting to process participants...");
    try {
      for (let i = 0; i < participants.length; i++) {
        const processTx = await contract.connect(owner).processNextParticipant();
        await processTx.wait();
        console.log(`  Processed participant ${i + 1}`);
      }
    } catch (error) {
      console.log("  ℹ️  Cannot process on local network (expected)");
    }
    console.log("");
  }

  console.log("========================================");
  console.log("PHASE 6: Results Summary");
  console.log("========================================\n");

  console.log("Participant Statuses:\n");

  for (const participant of participants) {
    console.log(`${participant.name}`);
    console.log(`  Address: ${participant.signer.address}`);

    const status = await contract.getParticipantStatus(participant.signer.address);
    console.log(`  Submitted: ${status[0]}`);

    if (status[0]) {
      console.log(`  Processed: ${status[2]}`);
      console.log(`  Reward: ${status[3]} tokens`);
    }

    const stats = await contract.getLifetimeStats(participant.signer.address);
    console.log(`  Lifetime Rewards: ${stats[0]} tokens`);
    console.log(`  Lifetime Carbon: ${stats[1]} grams CO2e`);
    console.log("");
  }

  // Period history
  const history = await contract.getPeriodHistory(currentPeriod);
  console.log("Period Summary:");
  console.log(`  Period Number: ${currentPeriod}`);
  console.log(`  Participants: ${history[4]}`);
  console.log(`  Total Rewards: ${history[5]} tokens`);
  console.log(`  Status: ${history[1] ? "Ended" : "Active"}`);
  console.log("");

  console.log("========================================");
  console.log("Simulation Complete!");
  console.log("========================================\n");

  if (isNewDeployment) {
    console.log("Contract deployed at:", contractAddress);
    console.log("\nTo interact with this contract:");
    console.log(`node scripts/interact.js ${contractAddress}`);
    console.log("");

    // Save simulation deployment info
    const deploymentInfo = {
      network: "simulation",
      contractAddress: contractAddress,
      deployer: owner.address,
      timestamp: new Date().toISOString(),
      participants: participants.length,
    };

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const simFile = path.join(deploymentsDir, "simulation-latest.json");
    fs.writeFileSync(simFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("Simulation info saved to:", simFile);
  }

  console.log("\n--- Understanding Reward Tiers ---");
  console.log("Bronze (10 tokens): 1,000 - 4,999 grams CO2e");
  console.log("Silver (25 tokens): 5,000 - 9,999 grams CO2e");
  console.log("Gold (50 tokens):   10,000+ grams CO2e");
  console.log("Minimum: 1,000 grams CO2e to qualify");
  console.log("");

  return contractAddress;
}

// Execute simulation
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n❌ Simulation failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
