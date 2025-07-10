const { task } = require("hardhat/config");
const fs = require("fs");
const path = require("path");

/**
 * Custom Hardhat task to get contract information
 * Usage: npx hardhat contract-info --address 0x123...
 * Or: npx hardhat contract-info (uses latest deployment)
 */
task("contract-info", "Displays information about the deployed contract")
  .addOptionalParam("address", "The contract address")
  .setAction(async (taskArgs, hre) => {
    let contractAddress = taskArgs.address;

    // If no address provided, try to load from latest deployment
    if (!contractAddress) {
      const network = hre.network.name;
      const deploymentFile = path.join(
        __dirname,
        "..",
        "deployments",
        `${network}-latest.json`
      );

      if (fs.existsSync(deploymentFile)) {
        const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
        contractAddress = deploymentData.contractAddress;
        console.log("\nUsing latest deployment from:", network);
      } else {
        console.error("\n❌ No contract address provided and no deployment file found");
        console.error("Usage: npx hardhat contract-info --address <contract-address>");
        return;
      }
    }

    console.log("\n========================================");
    console.log("Contract Information");
    console.log("========================================\n");
    console.log("Address:", contractAddress);
    console.log("Network:", hre.network.name);
    console.log("");

    try {
      // Connect to contract
      const PrivateGreenTravelRewards = await hre.ethers.getContractFactory(
        "PrivateGreenTravelRewards"
      );
      const contract = PrivateGreenTravelRewards.attach(contractAddress);

      // Get contract info
      const owner = await contract.owner();
      const currentPeriod = await contract.currentPeriod();
      const periodInfo = await contract.getCurrentPeriodInfo();
      const canEnd = await contract.canEndPeriod();

      console.log("--- Contract State ---");
      console.log("Owner:", owner);
      console.log("Current Period:", currentPeriod.toString());
      console.log("");

      console.log("--- Current Period Info ---");
      console.log("Period Number:", periodInfo[0].toString());
      console.log("Active:", periodInfo[1]);
      console.log("Ended:", periodInfo[2]);

      if (periodInfo[3] > 0) {
        console.log("Start Time:", new Date(Number(periodInfo[3]) * 1000).toLocaleString());
      }

      if (periodInfo[4] > 0) {
        console.log("End Time:", new Date(Number(periodInfo[4]) * 1000).toLocaleString());
      }

      console.log("Participants:", periodInfo[5].toString());
      console.log("Time Remaining:", formatDuration(periodInfo[6]));
      console.log("Can End Period:", canEnd);
      console.log("");

      // Check contract code
      const code = await hre.ethers.provider.getCode(contractAddress);
      console.log("Contract deployed:", code !== "0x");
      console.log("");

      // Get network-specific links
      if (hre.network.name === "sepolia") {
        console.log("--- Links ---");
        console.log("Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
        console.log("");
      }
    } catch (error) {
      console.error("Error fetching contract info:", error.message);
      console.log("");
    }
  });

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

module.exports = {};
