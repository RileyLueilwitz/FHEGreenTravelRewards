const { task } = require("hardhat/config");

/**
 * Custom Hardhat task to list accounts
 * Usage: npx hardhat list-accounts
 */
task("list-accounts", "Prints the list of accounts with balances")
  .setAction(async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    console.log("\n========================================");
    console.log("Available Accounts");
    console.log("========================================\n");

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const balance = await hre.ethers.provider.getBalance(account.address);

      console.log(`Account ${i}:`);
      console.log(`  Address: ${account.address}`);
      console.log(`  Balance: ${hre.ethers.formatEther(balance)} ETH`);
      console.log("");
    }

    console.log(`Total accounts: ${accounts.length}`);
    console.log("");
  });

module.exports = {};
