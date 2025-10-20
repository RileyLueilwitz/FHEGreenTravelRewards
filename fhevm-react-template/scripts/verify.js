const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Verify a deployed contract on Etherscan
 * Usage: node scripts/verify.js [contract-address] [network]
 * Or: node scripts/verify.js (uses latest deployment info)
 */
async function main() {
  console.log("========================================");
  console.log("  Contract Verification Script");
  console.log("========================================\n");

  let contractAddress;
  let constructorArgs = [];
  let network = process.env.HARDHAT_NETWORK || "sepolia";

  // Check for command line arguments
  if (process.argv.length >= 3) {
    contractAddress = process.argv[2];
    if (process.argv.length >= 4) {
      network = process.argv[3];
    }
  } else {
    // Try to load from latest deployment file
    console.log("No contract address provided. Looking for latest deployment...\n");
    const deploymentFile = path.join(
      __dirname,
      "..",
      "deployments",
      `${network}-latest.json`
    );

    if (fs.existsSync(deploymentFile)) {
      const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
      contractAddress = deploymentData.contractAddress;
      constructorArgs = deploymentData.constructorArgs || [];

      console.log("Found deployment info:");
      console.log("Contract:", deploymentData.contractName);
      console.log("Address:", contractAddress);
      console.log("Network:", deploymentData.network);
      console.log("Deployed at:", deploymentData.timestamp);
      console.log("");
    } else {
      console.error("❌ No deployment file found at:", deploymentFile);
      console.error("\nUsage: node scripts/verify.js <contract-address> [network]");
      process.exit(1);
    }
  }

  if (!contractAddress) {
    console.error("❌ Contract address is required");
    console.error("\nUsage: node scripts/verify.js <contract-address> [network]");
    process.exit(1);
  }

  console.log("--- Starting Verification ---");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network);
  console.log("Constructor Args:", constructorArgs.length > 0 ? constructorArgs : "None");
  console.log("");

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });

    console.log("\n✅ Contract verified successfully!\n");
    console.log("View on Etherscan:");

    if (network === "sepolia") {
      console.log(`https://sepolia.etherscan.io/address/${contractAddress}#code`);
    } else if (network === "mainnet") {
      console.log(`https://etherscan.io/address/${contractAddress}#code`);
    } else {
      console.log(`Check the appropriate block explorer for ${network}`);
    }
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified!");
      if (network === "sepolia") {
        console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
      }
    } else {
      console.error("\n❌ Verification failed:");
      console.error(error.message);

      console.log("\n--- Troubleshooting Tips ---");
      console.log("1. Make sure ETHERSCAN_API_KEY is set in your .env file");
      console.log("2. Wait a few moments after deployment before verifying");
      console.log("3. Ensure the contract is compiled with the same settings");
      console.log("4. Check that you're using the correct network");
      console.log("5. Verify constructor arguments match deployment");

      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
