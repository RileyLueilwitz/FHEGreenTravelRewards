# 🚀 Setup & Deployment Guide

Complete guide for setting up, testing, and deploying Private Green Travel Rewards.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

```bash
# Check Node.js version (v18.x or v20.x required)
node --version
# Should output: v18.0.0 or higher, or v20.0.0 or higher

# Check npm version
npm --version
# Should output: v9.0.0 or higher

# Check Git
git --version
# Should output: git version 2.x.x or higher
```

### Installation Commands

#### Node.js (if not installed)

**Windows:**
```bash
# Download from official website
https://nodejs.org/

# Or use nvm (Node Version Manager)
nvm install 20
nvm use 20
```

**macOS:**
```bash
# Using Homebrew
brew install node@20

# Or using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Linux:**
```bash
# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

#### Git (if not installed)

```bash
# Windows
https://git-scm.com/download/win

# macOS
brew install git

# Linux (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install git
```

### MetaMask Wallet

1. Install MetaMask browser extension:
   - Chrome: https://chrome.google.com/webstore
   - Firefox: https://addons.mozilla.org/firefox
   - Brave: Built-in or from Chrome store

2. Create new wallet or import existing
3. Save seed phrase securely (12 or 24 words)
4. Never share private keys or seed phrase

### Sepolia Testnet ETH

Get free testnet ETH from faucets:

**Option 1: Alchemy Sepolia Faucet**
```
1. Visit: https://sepoliafaucet.com/
2. Connect your wallet or enter address
3. Complete CAPTCHA
4. Receive 0.5 ETH (usually within 1 minute)
```

**Option 2: PoW Faucet**
```
1. Visit: https://sepolia-faucet.pk910.de/
2. Start mining (browser-based)
3. Mine for 10-30 minutes
4. Claim ~0.05-0.1 ETH
```

**Option 3: Infura Faucet**
```
1. Visit: https://www.infura.io/faucet/sepolia
2. Sign in with Infura account
3. Enter wallet address
4. Receive 0.5 ETH per day
```

---

## Installation

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd fhevm-react-template

# Verify files
ls -la
```

Expected output:
```
contracts/
scripts/
test/
docs/
README.md
package.json
hardhat.config.js
.env.example
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This installs:
# - Hardhat and plugins
# - Ethers.js v6
# - Testing libraries (Mocha, Chai)
# - Security tools (Solhint, ESLint)
# - Performance tools (Gas Reporter, Contract Sizer)
```

Expected output:
```
added 500+ packages in 30s
```

### Step 3: Verify Installation

```bash
# Check Hardhat installation
npx hardhat --version
# Output: Hardhat version 2.19.0 or higher

# List available tasks
npx hardhat
# Should show: compile, test, deploy, etc.

# Check dependencies
npm list --depth=0
```

---

## Configuration

### Step 1: Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Edit with your favorite editor
# Windows: notepad .env
# macOS/Linux: nano .env or vim .env
```

### Step 2: Configure Environment Variables

Edit `.env` file with your values:

```env
# ========================================
# PRIVATE KEYS AND ACCOUNTS
# ========================================
# WARNING: Never commit your actual private key!

# Get from MetaMask: Account Details → Export Private Key
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# ========================================
# RPC ENDPOINTS
# ========================================

# Sepolia Testnet RPC
# Get free API key from: https://www.alchemy.com/ or https://infura.io/
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Alternative providers:
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
# SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com

# ========================================
# API KEYS FOR VERIFICATION
# ========================================

# Etherscan API key for contract verification
# Get from: https://etherscan.io/myapikey
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# CoinMarketCap API key for gas price reporting (optional)
# Get from: https://pro.coinmarketcap.com/signup
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# ========================================
# GAS AND PERFORMANCE SETTINGS
# ========================================

# Enable gas reporting (true/false)
REPORT_GAS=false

# Enable contract size reporting (true/false)
CONTRACT_SIZER=false

# ========================================
# SECURITY CONFIGURATION
# ========================================

# Enable security checks before deployment
SECURITY_CHECKS=true

# Emergency stop mechanism
EMERGENCY_STOP_ENABLED=true
```

### Step 3: Get API Keys

#### Alchemy API Key (for Sepolia RPC)

1. Visit https://www.alchemy.com/
2. Sign up for free account
3. Create new app:
   - Name: "Private Green Travel Rewards"
   - Network: Ethereum
   - Chain: Sepolia
4. Copy API key from dashboard
5. Paste into `.env`: `SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`

#### Etherscan API Key (for verification)

1. Visit https://etherscan.io/
2. Sign up for free account
3. Go to https://etherscan.io/myapikey
4. Create new API key
5. Copy key
6. Paste into `.env`: `ETHERSCAN_API_KEY=YOUR_KEY`

### Step 4: Verify Configuration

```bash
# Test RPC connection
curl -X POST $SEPOLIA_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return current block number
```

---

## Local Development

### Step 1: Start Local Hardhat Network

Open **Terminal 1**:

```bash
# Start local Ethereum node
npm run node

# Or directly:
npx hardhat node
```

Expected output:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

... (19 more accounts)
```

Keep this terminal running!

### Step 2: Compile Contracts

Open **Terminal 2**:

```bash
# Compile all Solidity contracts
npm run compile

# Or directly:
npx hardhat compile
```

Expected output:
```
Compiling 1 file with 0.8.24
Compilation finished successfully
Compiled 1 Solidity file successfully
```

Artifacts created in:
- `artifacts/` - Compiled contract ABIs and bytecode
- `cache/` - Compilation cache
- `typechain-types/` - TypeScript type definitions

### Step 3: Deploy Locally

In **Terminal 2**:

```bash
# Deploy to local network
npm run deploy:local

# Or directly:
npx hardhat run scripts/deploy.js --network localhost
```

Expected output:
```
🚀 Starting deployment...

📍 Network: localhost (31337)
👤 Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Balance: 9999.998 ETH

🔨 Deploying PrivateGreenTravelRewards...
✅ Contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📋 Transaction hash: 0x...
⛽ Gas used: 2,134,567

💾 Deployment info saved to: deployments/localhost-latest.json
```

### Step 4: Interact with Contract

```bash
# Interactive CLI
npm run interact

# Follow prompts to:
# 1. View contract info
# 2. Start new period
# 3. Submit travel data
# 4. View participant status
# 5. Process rewards
# 6. Claim rewards
```

### Step 5: Run Simulation

```bash
# Run complete workflow simulation
npm run simulate
```

Expected output:
```
🎬 Starting Private Green Travel Rewards Simulation

✅ Contract deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📅 Starting new reward period...
✅ Period 1 started

👥 Simulating participant submissions...
   Alice (0x70997...): 3,500g CO2 saved
   Bob (0x3C44c...): 7,200g CO2 saved
   Charlie (0x90F79...): 12,000g CO2 saved

⏭️  Fast-forwarding 7 days...

🏁 Ending period and processing rewards...
   Alice: Bronze tier → 10 tokens
   Bob: Silver tier → 25 tokens
   Charlie: Gold tier → 50 tokens

💰 Total rewards distributed: 85 tokens

🎉 Simulation completed successfully!
```

---

## Testing

### Run All Tests

```bash
# Run complete test suite (54 tests)
npm test

# Or directly:
npx hardhat test
```

Expected output:
```
PrivateGreenTravelRewards - Comprehensive Test Suite
  Deployment and Initialization
    ✓ Should deploy with correct owner (245ms)
    ✓ Should start with period 0 (89ms)
    ✓ Should initialize with correct reward tiers (156ms)
    ✓ Should set correct contract owner (67ms)
    ✓ Should have zero participants initially (45ms)

  Period Management
    ✓ Owner can start new period (312ms)
    ✓ Non-owner cannot start period (67ms)
    ✓ Cannot start period when one is active (98ms)
    ... (46 more tests)

54 passing (12.3s)
```

### Test with Coverage

```bash
# Generate coverage report
npm run test:coverage

# Or directly:
npx hardhat coverage
```

Expected output:
```
-------------------------------|----------|----------|----------|----------|
File                           |  % Stmts | % Branch |  % Funcs |  % Lines |
-------------------------------|----------|----------|----------|----------|
 contracts/                    |      100 |    95.45 |      100 |      100 |
  PrivateGreenTravelRewards.sol|      100 |    95.45 |      100 |      100 |
-------------------------------|----------|----------|----------|----------|
All files                      |      100 |    95.45 |      100 |      100 |
-------------------------------|----------|----------|----------|----------|
```

Coverage report saved to: `coverage/index.html`

### Test with Gas Reporting

```bash
# Run tests with gas usage analysis
npm run test:gas

# Or with environment variable:
REPORT_GAS=true npm test
```

Expected output:
```
·-----------------------------------------|----------------------------|-------------|----------------------------·
|   Solc version: 0.8.24                  ·  Optimizer enabled: true   ·  Runs: 200  ·  Block limit: 30000000 gas │
··········································|····························|·············|·····························
|  Methods                                                                                                        │
·····················|····················|·········|··········|·········|··············|··············
|  Contract          ·  Method            ·  Min    ·  Max     ·  Avg   ·  # calls     ·  usd (avg)  │
·····················|····················|·········|··········|·········|··············|··············
|  PrivateGreen...   ·  startNewPeriod   ·  95123  ·  98456   ·  96789 ·         15   ·       9.70   │
·····················|····················|·········|··········|·········|··············|··············
|  PrivateGreen...   ·  submitTravelData ·  145234 ·  152345  ·  148789·         45   ·      14.90   │
·····················|····················|·········|··········|·········|··············|··············
|  PrivateGreen...   ·  endPeriod        ·  78123  ·  82456   ·  80289 ·          8   ·       8.00   │
·····················|····················|·········|··········|·········|··············|··············
```

### Test Specific File

```bash
# Test only specific file
npx hardhat test test/PrivateGreenTravelRewards.comprehensive.test.js

# Test specific describe block
npx hardhat test --grep "Period Management"

# Test specific test case
npx hardhat test --grep "Should deploy with correct owner"
```

### Security Testing

```bash
# Run NPM audit
npm run security:audit

# Run Slither static analysis
npm run security:slither

# Run all security checks
npm run security
```

---

## Deployment

### Deploy to Sepolia Testnet

#### Step 1: Pre-deployment Checklist

```bash
# 1. Check your balance
npx hardhat balance --account YOUR_ADDRESS --network sepolia

# Should have at least 0.3 ETH for deployment + testing

# 2. Verify .env configuration
cat .env | grep SEPOLIA_RPC_URL
cat .env | grep PRIVATE_KEY
cat .env | grep ETHERSCAN_API_KEY

# 3. Compile contracts
npm run compile

# 4. Run tests one more time
npm test

# 5. Run security checks
npm run security
```

#### Step 2: Deploy Contract

```bash
# Deploy to Sepolia
npm run deploy

# Or directly:
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
🚀 Starting deployment to Sepolia...

📍 Network: sepolia (11155111)
👤 Deployer: 0xYourAddress
💰 Balance: 0.5 ETH

🔨 Deploying PrivateGreenTravelRewards...
⏳ Waiting for transaction confirmation...
✅ Contract deployed!

📋 Contract address: 0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B
📝 Transaction hash: 0x...
⛽ Gas used: 2,134,567
💵 Deployment cost: 0.107 ETH

💾 Deployment info saved to: deployments/sepolia-latest.json

🔗 View on Etherscan:
https://sepolia.etherscan.io/address/0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B

📌 Next steps:
1. Wait 2-3 minutes for block confirmations
2. Run: npm run verify
3. Interact with contract: npm run interact
```

#### Step 3: Save Deployment Info

Deployment information automatically saved to:
- `deployments/sepolia-latest.json` - Latest deployment
- `deployments/sepolia-[timestamp].json` - Historical record

Contains:
```json
{
  "network": "sepolia",
  "chainId": "11155111",
  "contractAddress": "0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B",
  "deployer": "0xYourAddress",
  "transactionHash": "0x...",
  "blockNumber": 12345678,
  "timestamp": "2024-10-25T10:30:00.000Z",
  "constructorArguments": []
}
```

---

## Verification

### Verify on Etherscan

#### Step 1: Wait for Confirmations

```bash
# Wait 2-3 minutes after deployment
sleep 180
```

#### Step 2: Run Verification Script

```bash
# Verify contract
npm run verify

# Or directly:
npx hardhat run scripts/verify.js --network sepolia
```

Expected output:
```
🔍 Starting Etherscan verification...

📋 Contract address: 0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B
🌐 Network: sepolia

⏳ Verifying contract on Etherscan...
✅ Contract verified successfully!

🔗 View verified contract:
https://sepolia.etherscan.io/address/0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B#code

✨ You can now:
- Read contract functions on Etherscan
- Write functions directly through Etherscan UI
- Share verified source code with others
```

#### Step 3: Manual Verification (if auto-verify fails)

```bash
# Get constructor arguments
cat deployments/sepolia-latest.json

# Verify manually
npx hardhat verify --network sepolia \
  0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B

# If contract already verified:
# "Contract source code already verified"
```

### Verification Troubleshooting

**Issue: "Failed to send verification request"**
```bash
# Wait longer and retry
sleep 60
npm run verify
```

**Issue: "Invalid API key"**
```bash
# Check your Etherscan API key
echo $ETHERSCAN_API_KEY

# Get new key from: https://etherscan.io/myapikey
# Update .env file
```

**Issue: "Contract source code already verified"**
```bash
# This is actually success! Contract is already verified.
# Check on Etherscan to confirm.
```

---

## Troubleshooting

### Common Issues

#### 1. Compilation Fails

**Error:** `Solc version mismatch`

```bash
# Solution: Clean and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run compile
```

#### 2. Tests Failing

**Error:** `TypeError: Cannot read property 'xxxx' of undefined`

```bash
# Solution: Check Node.js version
node --version
# Must be v18.x or v20.x

# Reinstall dependencies
rm -rf node_modules
npm install
npm test
```

#### 3. Deployment Fails

**Error:** `Insufficient funds for gas`

```bash
# Solution: Get more Sepolia ETH
# Visit: https://sepoliafaucet.com/

# Check current balance
npx hardhat balance --account YOUR_ADDRESS --network sepolia
```

**Error:** `Network request failed`

```bash
# Solution: Check RPC URL
curl -X POST $SEPOLIA_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# If fails, get new RPC URL from Alchemy or Infura
```

#### 4. Verification Fails

**Error:** `Failed to verify contract`

```bash
# Solution 1: Wait and retry
sleep 180  # Wait 3 minutes
npm run verify

# Solution 2: Check API key
echo $ETHERSCAN_API_KEY

# Solution 3: Verify manually on Etherscan
# Visit: https://sepolia.etherscan.io/verifyContract
```

#### 5. MetaMask Issues

**Error:** `User rejected transaction`

```bash
# Solution:
# 1. Check MetaMask is unlocked
# 2. Switch to correct network (Sepolia)
# 3. Ensure sufficient balance
# 4. Try again
```

#### 6. Git Issues

**Error:** `Permission denied (publickey)`

```bash
# Solution: Set up SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Copy and add to GitHub: Settings → SSH Keys
```

### Debug Mode

```bash
# Enable Hardhat verbose logging
npx hardhat test --verbose

# Enable Hardhat stack traces
npx hardhat test --stack-traces

# Enable detailed gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test with console.log
npx hardhat test test/PrivateGreenTravelRewards.comprehensive.test.js
```

### Getting Help

1. **Check documentation:**
   - README.md
   - PROJECT_OVERVIEW.md
   - TECHNICAL_DOCUMENTATION.md

2. **Review logs:**
   - Hardhat output
   - Test results
   - Deployment receipts

3. **Common solutions:**
   - Clear cache: `npm run clean`
   - Reinstall: `rm -rf node_modules && npm install`
   - Update dependencies: `npm update`

4. **Community support:**
   - Hardhat Discord: https://discord.gg/hardhat
   - Zama Discord: https://discord.gg/zama
   - GitHub Issues: (your repo issues)

---

## Next Steps

After successful deployment:

1. **Interact with Contract:**
   ```bash
   npm run interact
   ```

2. **Start Testing:**
   - Start new period
   - Submit travel data
   - Process rewards
   - Claim tokens

3. **Monitor Contract:**
   - View on Sepolia Etherscan
   - Check transaction history
   - Monitor gas usage

4. **Build Frontend:**
   - React + Vite integration
   - MetaMask connection
   - fhevmjs encryption

5. **Community Launch:**
   - Share contract address
   - Invite users to participate
   - Gather feedback

---

**🎉 Congratulations! You've successfully set up Private Green Travel Rewards!**

For more information, see:
- [README.md](./README.md) - Project overview
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Detailed architecture
- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) - Technical specs

---

**Last Updated:** October 25, 2024
**Version:** 1.0.0
