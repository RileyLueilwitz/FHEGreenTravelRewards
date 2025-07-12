const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("  Private Green Travel Rewards System");
  console.log("  Deployment Script");
  console.log("========================================\n");

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  if (parseFloat(ethers.formatEther(balance)) < 0.01) {
    console.warn("\n⚠️  WARNING: Low balance detected. Deployment may fail.");
  }

  console.log("\n--- Starting Deployment ---\n");

  // Deploy the contract
  const PrivateGreenTravelRewards = await ethers.getContractFactory("PrivateGreenTravelRewards");

  console.log("Deploying PrivateGreenTravelRewards...");
  const contract = await PrivateGreenTravelRewards.deploy();

  console.log("Waiting for deployment transaction...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deploymentTx = contract.deploymentTransaction();

  console.log("\n✅ Deployment Successful!\n");
  console.log("========================================");
  console.log("Contract Address:", contractAddress);
  console.log("Transaction Hash:", deploymentTx.hash);
  console.log("Block Number:", deploymentTx.blockNumber);
  console.log("========================================\n");

  // Verify contract state
  console.log("--- Contract Initial State ---");
  try {
    const owner = await contract.owner();
    const currentPeriod = await contract.currentPeriod();

    console.log("Owner:", owner);
    console.log("Current Period:", currentPeriod.toString());
    console.log("");
  } catch (error) {
    console.error("Error reading contract state:", error.message);
  }

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractName: "PrivateGreenTravelRewards",
    contractAddress: contractAddress,
    deployer: deployer.address,
    transactionHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber,
    timestamp: new Date().toISOString(),
    constructorArgs: [],
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to JSON file
  const deploymentFile = path.join(
    deploymentsDir,
    `${network.name}-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to:", deploymentFile);

  // Save latest deployment info
  const latestFile = path.join(deploymentsDir, `${network.name}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Latest deployment saved to:", latestFile);

  // Generate Etherscan verification command
  if (network.name === "sepolia") {
    console.log("\n--- Etherscan Verification ---");
    console.log("To verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network sepolia ${contractAddress}`);
    console.log("\nOr use the verification script:");
    console.log(`node scripts/verify.js ${contractAddress}`);
    console.log("\nEtherscan URL:");
    console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
  }

  console.log("\n--- Next Steps ---");
  console.log("1. Verify the contract on Etherscan (if on testnet/mainnet)");
  console.log("2. Test contract interactions using: node scripts/interact.js");
  console.log("3. Run simulations using: node scripts/simulate.js");
  console.log("4. Update your frontend with the contract address");

  return {
    contract,
    address: contractAddress,
    deploymentInfo,
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n❌ Deployment failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;