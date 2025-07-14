# Deployment Guide

Complete guide for deploying and verifying the Private Green Travel Rewards smart contract.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Testnet Deployment (Sepolia)](#testnet-deployment-sepolia)
- [Contract Verification](#contract-verification)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js (v16 or higher)
- npm or yarn
- A wallet with testnet ETH (for Sepolia)
- Alchemy or Infura API key (for RPC access)
- Etherscan API key (for verification)

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Your wallet private key (with 0x prefix)
PRIVATE_KEY=0x1234567890abcdef...

# Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Etherscan API key for verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Gas reporting (optional)
REPORT_GAS=false
```

**Security Note:** Never commit your `.env` file to version control!

### 3. Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

## Local Development

### Start Local Hardhat Node

Terminal 1:
```bash
npm run node
```

This starts a local Ethereum network at `http://127.0.0.1:8545/`

### Deploy to Local Network

Terminal 2:
```bash
npm run deploy:local
```

### Run Simulation

Test the complete workflow locally:

```bash
npm run simulate
```

This will:
- Deploy the contract
- Start a reward period
- Simulate multiple users submitting travel data
- End the period
- Display results

## Testnet Deployment (Sepolia)

### 1. Get Testnet ETH

Obtain Sepolia ETH from a faucet:
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Chainlink Sepolia Faucet](https://faucets.chain.link/)

### 2. Deploy to Sepolia

```bash
npm run deploy
```

Example output:
```
========================================
  Private Green Travel Rewards System
  Deployment Script
========================================

Network: sepolia
Chain ID: 11155111

Deployer address: 0x1234...
Deployer balance: 0.5 ETH

--- Starting Deployment ---

Deploying PrivateGreenTravelRewards...
Waiting for deployment transaction...

✅ Deployment Successful!

========================================
Contract Address: 0xABCD1234...
Transaction Hash: 0x5678...
Block Number: 5123456
========================================

--- Contract Initial State ---
Owner: 0x1234...
Current Period: 1

📝 Deployment info saved to: deployments/sepolia-latest.json
```

### 3. Save Deployment Information

Deployment details are automatically saved to:
- `deployments/sepolia-latest.json` (latest deployment)
- `deployments/sepolia-[timestamp].json` (historical record)

## Contract Verification

### Automatic Verification

Using the verification script:

```bash
npm run verify
```

This automatically reads the latest deployment and verifies on Etherscan.

### Manual Verification

If you need to verify manually:

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

Or with specific address:

```bash
node scripts/verify.js 0xYourContractAddress sepolia
```

### Verification Success

Once verified, you'll see:
```
✅ Contract verified successfully!

View on Etherscan:
https://sepolia.etherscan.io/address/0xYourAddress#code
```

## Post-Deployment

### 1. Interact with Contract

Use the interactive script:

```bash
npm run interact
```

Or specify contract address:

```bash
node scripts/interact.js 0xYourContractAddress
```

### 2. View Contract Information

Using Hardhat task:

```bash
npx hardhat contract-info --network sepolia
```

Or specify address:

```bash
npx hardhat contract-info --address 0xYourAddress --network sepolia
```

### 3. Start First Period

After deployment, the contract needs an active period. Connect as owner and:

```bash
npm run interact
# Select option 3: Start New Period
```

### 4. Update Frontend

Update your frontend application with the deployed contract address from:

```json
deployments/sepolia-latest.json
```

## Network-Specific Deployments

### Zama Network (FHE Testnet)

Deploy to Zama's FHE-enabled testnet:

```bash
npm run deploy:zama
```

**Note:** Zama network provides full FHE capabilities for private computation.

### Configuration for Other Networks

Edit `hardhat.config.js` to add new networks:

```javascript
networks: {
  yourNetwork: {
    url: "YOUR_RPC_URL",
    accounts: [PRIVATE_KEY],
    chainId: YOUR_CHAIN_ID,
  },
}
```

## Deployment Checklist

Before deploying to mainnet:

- [ ] All tests passing (`npm test`)
- [ ] Security audit completed
- [ ] Gas optimization reviewed
- [ ] Environment variables configured
- [ ] Sufficient ETH in deployer wallet
- [ ] Contract compiled successfully
- [ ] Testnet deployment tested
- [ ] Etherscan API key ready
- [ ] Frontend integration tested
- [ ] Backup of deployment keys

## Contract Addresses

Record your deployed contract addresses:

### Sepolia Testnet
```
Contract: 0x...
Deployer: 0x...
Tx Hash: 0x...
Block: #...
Etherscan: https://sepolia.etherscan.io/address/0x...
```

### Mainnet
```
Contract: 0x...
Deployer: 0x...
Tx Hash: 0x...
Block: #...
Etherscan: https://etherscan.io/address/0x...
```

## Troubleshooting

### Issue: "Insufficient funds"

**Solution:** Ensure your wallet has enough ETH for gas fees.

```bash
npx hardhat balance --account YOUR_ADDRESS --network sepolia
```

### Issue: "Invalid API Key" (Etherscan)

**Solution:** Verify your Etherscan API key in `.env`

Get a key from: https://etherscan.io/myapikey

### Issue: "Already Verified"

**Solution:** Contract is already verified. Check Etherscan directly.

### Issue: "Contract not found"

**Solution:** Wait a few blocks after deployment before verifying.

### Issue: Compilation Errors

**Solution:** Clean and recompile:

```bash
npm run clean
npm run compile
```

### Issue: Network Connection Failed

**Solution:**
1. Check your RPC URL in `.env`
2. Verify network is operational
3. Try alternative RPC provider

### Issue: Transaction Reverted

**Solution:** Check:
1. Gas limit is sufficient
2. Contract state allows the operation
3. Caller has required permissions

## Gas Estimates

Typical gas costs on Sepolia:

| Operation | Gas Used | Cost (at 50 gwei) |
|-----------|----------|-------------------|
| Deploy | ~3,000,000 | ~0.15 ETH |
| Start Period | ~100,000 | ~0.005 ETH |
| Submit Data | ~150,000 | ~0.0075 ETH |
| End Period | ~80,000 | ~0.004 ETH |

**Note:** Actual costs vary with network congestion.

## Next Steps

After successful deployment:

1. Verify contract on Etherscan
2. Test basic operations using `interact.js`
3. Update frontend configuration
4. Start first reward period
5. Monitor contract events
6. Set up monitoring/alerts

## Support

For deployment issues:
- Check [Hardhat Documentation](https://hardhat.org/docs)
- Review [Etherscan Verification Guide](https://hardhat.org/plugins/nomiclabs-hardhat-etherscan)
- Open an issue on GitHub
