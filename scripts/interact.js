const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Interactive script to interact with the deployed PrivateGreenTravelRewards contract
 * Usage: node scripts/interact.js [contract-address]
 */
async function main() {
  console.log("========================================");
  console.log("  Contract Interaction Script");
  console.log("========================================\n");

  let contractAddress;

  // Check for command line argument
  if (process.argv.length >= 3) {
    contractAddress = process.argv[2];
  } else {
    // Try to load from latest deployment file
    const network = process.env.HARDHAT_NETWORK || "sepolia";
    const deploymentFile = path.join(
      __dirname,
      "..",
      "deployments",
      `${network}-latest.json`
    );

    if (fs.existsSync(deploymentFile)) {
      const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
      contractAddress = deploymentData.contractAddress;
      console.log("Using contract from latest deployment:");
      console.log("Address:", contractAddress);
      console.log("Network:", deploymentData.network);
      console.log("");
    } else {
      console.error("❌ No deployment file found");
      console.error("\nUsage: node scripts/interact.js <contract-address>");
      process.exit(1);
    }
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Interacting with account:", signer.address);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Connect to contract
  const PrivateGreenTravelRewards = await ethers.getContractFactory(
    "PrivateGreenTravelRewards"
  );
  const contract = PrivateGreenTravelRewards.attach(contractAddress);

  console.log("Connected to contract at:", contractAddress);
  console.log("");

  // Main interaction loop
  let running = true;
  while (running) {
    console.log("========================================");
    console.log("Available Actions:");
    console.log("========================================");
    console.log("1. View Contract Info");
    console.log("2. View Current Period Status");
    console.log("3. Start New Period (Owner only)");
    console.log("4. Submit Travel Data");
    console.log("5. End Period");
    console.log("6. Process Next Participant");
    console.log("7. View My Status");
    console.log("8. View My Lifetime Stats");
    console.log("9. Claim Rewards");
    console.log("10. View Period History");
    console.log("0. Exit");
    console.log("========================================\n");

    const choice = await question("Select an action (0-10): ");
    console.log("");

    try {
      switch (choice.trim()) {
        case "1":
          await viewContractInfo(contract);
          break;

        case "2":
          await viewCurrentPeriod(contract);
          break;

        case "3":
          await startNewPeriod(contract, signer);
          break;

        case "4":
          await submitTravelData(contract, signer);
          break;

        case "5":
          await endPeriod(contract, signer);
          break;

        case "6":
          await processNextParticipant(contract, signer);
          break;

        case "7":
          await viewMyStatus(contract, signer);
          break;

        case "8":
          await viewLifetimeStats(contract, signer);
          break;

        case "9":
          await claimRewards(contract, signer);
          break;

        case "10":
          await viewPeriodHistory(contract);
          break;

        case "0":
          running = false;
          console.log("Goodbye!");
          break;

        default:
          console.log("Invalid choice. Please try again.\n");
      }
    } catch (error) {
      console.error("Error:", error.message);
      console.log("");
    }
  }

  rl.close();
}

async function viewContractInfo(contract) {
  console.log("--- Contract Information ---");
  const owner = await contract.owner();
  const currentPeriod = await contract.currentPeriod();

  console.log("Owner:", owner);
  console.log("Current Period:", currentPeriod.toString());
  console.log("");
}

async function viewCurrentPeriod(contract) {
  console.log("--- Current Period Status ---");

  const periodInfo = await contract.getCurrentPeriodInfo();
  const canEnd = await contract.canEndPeriod();

  console.log("Period Number:", periodInfo[0].toString());
  console.log("Active:", periodInfo[1]);
  console.log("Ended:", periodInfo[2]);
  console.log("Start Time:", new Date(Number(periodInfo[3]) * 1000).toLocaleString());

  if (periodInfo[4] > 0) {
    console.log("End Time:", new Date(Number(periodInfo[4]) * 1000).toLocaleString());
  }

  console.log("Participants:", periodInfo[5].toString());
  console.log("Time Remaining:", formatDuration(periodInfo[6]));
  console.log("Can End Period:", canEnd);
  console.log("");
}

async function startNewPeriod(contract, signer) {
  console.log("--- Starting New Period ---");

  const owner = await contract.owner();
  if (signer.address.toLowerCase() !== owner.toLowerCase()) {
    console.log("❌ Only the owner can start a new period");
    console.log("");
    return;
  }

  console.log("Sending transaction...");
  const tx = await contract.startNewPeriod();
  console.log("Transaction hash:", tx.hash);

  console.log("Waiting for confirmation...");
  await tx.wait();

  console.log("✅ New period started successfully!");
  console.log("");
}

async function submitTravelData(contract, signer) {
  console.log("--- Submit Travel Data ---");

  const carbonSaved = await question("Enter carbon saved (grams CO2e): ");
  const carbonValue = parseInt(carbonSaved);

  if (isNaN(carbonValue) || carbonValue <= 0) {
    console.log("❌ Invalid carbon value");
    console.log("");
    return;
  }

  console.log(`Submitting ${carbonValue} grams CO2e...`);
  const tx = await contract.submitTravelData(carbonValue);
  console.log("Transaction hash:", tx.hash);

  console.log("Waiting for confirmation...");
  await tx.wait();

  console.log("✅ Travel data submitted successfully!");
  console.log("");
}

async function endPeriod(contract, signer) {
  console.log("--- End Current Period ---");

  const canEnd = await contract.canEndPeriod();
  if (!canEnd) {
    console.log("❌ Period cannot be ended yet");
    console.log("");
    return;
  }

  console.log("Sending transaction...");
  const tx = await contract.endPeriod();
  console.log("Transaction hash:", tx.hash);

  console.log("Waiting for confirmation...");
  await tx.wait();

  console.log("✅ Period ended! Decryption process initiated.");
  console.log("Note: You may need to call 'Process Next Participant' to complete all rewards.");
  console.log("");
}

async function processNextParticipant(contract, signer) {
  console.log("--- Process Next Participant ---");

  console.log("Sending transaction...");
  const tx = await contract.processNextParticipant();
  console.log("Transaction hash:", tx.hash);

  console.log("Waiting for confirmation...");
  await tx.wait();

  console.log("✅ Next participant processing initiated!");
  console.log("");
}

async function viewMyStatus(contract, signer) {
  console.log("--- My Status (Current Period) ---");

  const status = await contract.getParticipantStatus(signer.address);

  console.log("Has Submitted:", status[0]);

  if (status[0]) {
    console.log("Submission Time:", new Date(Number(status[1]) * 1000).toLocaleString());
    console.log("Processed:", status[2]);
    console.log("Reward:", status[3].toString(), "tokens");
  }

  console.log("");
}

async function viewLifetimeStats(contract, signer) {
  console.log("--- My Lifetime Statistics ---");

  const stats = await contract.getLifetimeStats(signer.address);

  console.log("Total Rewards Earned:", stats[0].toString(), "tokens");
  console.log("Total Carbon Saved:", stats[1].toString(), "grams CO2e");
  console.log("");
}

async function claimRewards(contract, signer) {
  console.log("--- Claim Rewards ---");

  const stats = await contract.getLifetimeStats(signer.address);
  const totalRewards = stats[0];

  if (totalRewards === 0n) {
    console.log("❌ No rewards to claim");
    console.log("");
    return;
  }

  console.log("Total rewards available:", totalRewards.toString(), "tokens");
  console.log("Sending transaction...");

  const tx = await contract.claimRewards();
  console.log("Transaction hash:", tx.hash);

  console.log("Waiting for confirmation...");
  await tx.wait();

  console.log("✅ Rewards claimed successfully!");
  console.log("");
}

async function viewPeriodHistory(contract) {
  const periodNum = await question("Enter period number to view: ");
  const period = parseInt(periodNum);

  if (isNaN(period) || period <= 0) {
    console.log("❌ Invalid period number");
    console.log("");
    return;
  }

  console.log(`--- Period ${period} History ---`);

  const history = await contract.getPeriodHistory(period);

  console.log("Active:", history[0]);
  console.log("Ended:", history[1]);
  console.log("Start Time:", new Date(Number(history[2]) * 1000).toLocaleString());

  if (history[3] > 0) {
    console.log("End Time:", new Date(Number(history[3]) * 1000).toLocaleString());
  }

  console.log("Participants:", history[4].toString());
  console.log("Total Rewards Distributed:", history[5].toString(), "tokens");
  console.log("");
}

function formatDuration(seconds) {
  const sec = Number(seconds);
  if (sec === 0) return "Ended";

  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "< 1m";
}

// Execute
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
