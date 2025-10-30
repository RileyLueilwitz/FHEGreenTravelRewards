const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying PrivateGreenTravelRewards contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const PrivateGreenTravelRewards = await ethers.getContractFactory("PrivateGreenTravelRewards");
  const contract = await PrivateGreenTravelRewards.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("PrivateGreenTravelRewards deployed to:", contractAddress);
  console.log("\nDeployment successful!");
  console.log("\nContract details:");
  console.log("- Owner:", await contract.owner());
  console.log("- Current Period:", await contract.currentPeriod());

  console.log("\nSave this address for frontend integration:", contractAddress);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });