const { task } = require("hardhat/config");

/**
 * Custom Hardhat task to check account balance
 * Usage: npx hardhat balance --account 0x123...
 */
task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account);

    console.log("\n========================================");
    console.log("Account Balance");
    console.log("========================================\n");
    console.log("Address:", taskArgs.account);
    console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
    console.log("");
  });

module.exports = {};
