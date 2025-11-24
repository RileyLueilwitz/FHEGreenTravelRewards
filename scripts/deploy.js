const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy PrivacyGateway
  console.log("\nDeploying PrivacyGateway...");
  const PrivacyGateway = await ethers.getContractFactory("PrivacyGateway");
  const privacyGateway = await PrivacyGateway.deploy();
  await privacyGateway.waitForDeployment();
  console.log("PrivacyGateway deployed to:", privacyGateway.target);

  // Deploy PrivacyComputation
  console.log("\nDeploying PrivacyComputation...");
  const PrivacyComputation = await ethers.getContractFactory("PrivacyComputation");
  const privacyComputation = await PrivacyComputation.deploy();
  await privacyComputation.waitForDeployment();
  console.log("PrivacyComputation deployed to:", privacyComputation.target);

  // Deploy ExamplePrivacyDApp
  console.log("\nDeploying ExamplePrivacyDApp...");
  const ExamplePrivacyDApp = await ethers.getContractFactory("ExamplePrivacyDApp");
  const exampleDApp = await ExamplePrivacyDApp.deploy(
    privacyGateway.target,
    privacyComputation.target
  );
  await exampleDApp.waitForDeployment();
  console.log("ExamplePrivacyDApp deployed to:", exampleDApp.target);

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    privacyGateway: privacyGateway.target,
    privacyComputation: privacyComputation.target,
    examplePrivacyDApp: exampleDApp.target,
    deploymentTime: new Date().toISOString(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const timestamp = Date.now();
  fs.writeFileSync(
    path.join(deploymentPath, `deployment-${timestamp}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\nDeployment info saved to: deployments/deployment-${timestamp}.json`);

  // Verify contracts if not on hardhat
  const network = (await ethers.provider.getNetwork()).name;
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\nWaiting before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    console.log("Verifying contracts...");

    try {
      await hre.run("verify:verify", {
        address: privacyGateway.target,
        constructorArguments: [],
      });
      console.log("PrivacyGateway verified");
    } catch (error) {
      console.log("PrivacyGateway verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: privacyComputation.target,
        constructorArguments: [],
      });
      console.log("PrivacyComputation verified");
    } catch (error) {
      console.log("PrivacyComputation verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: exampleDApp.target,
        constructorArguments: [privacyGateway.target, privacyComputation.target],
      });
      console.log("ExamplePrivacyDApp verified");
    } catch (error) {
      console.log("ExamplePrivacyDApp verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });