# 🔐 Universal FHEVM SDK + Private Green Travel Rewards

> **Framework-agnostic SDK for building privacy-preserving dApps with Fully Homomorphic Encryption**
>
> Demonstrating real-world FHE applications through an anonymous green travel rewards system

[![Live Demo](https://img.shields.io/badge/🌐-Live%20Demo-brightgreen)](https://fhe-green-travel-rewards.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/RileyLueilwitz/FHEGreenTravelRewards)
[![SDK](https://img.shields.io/badge/SDK-Universal-orange)]()

---

## 📹 Demo Video

**Download and watch the demonstration video:** `demo.mp4` (located in this repository)

*Note: The video file must be downloaded to view. It demonstrates the complete SDK integration and the Private Green Travel Rewards application.*

**Video Contents:**
- Universal FHEVM SDK architecture and features
- Quick integration guide (less than 10 lines of code)
- React and Next.js examples walkthrough
- Private Green Travel Rewards dApp demonstration
- Privacy-preserving carbon tracking in action

---

## 🌟 Project Overview

This project consists of two main components:

### 1. Universal FHEVM SDK

A **framework-agnostic SDK** that simplifies building confidential frontends with Zama's FHEVM technology. Inspired by wagmi's developer experience, the SDK provides:

- ✅ **Single Package** - All FHEVM dependencies wrapped
- ✅ **Intuitive API** - React hooks, core functions, utilities
- ✅ **Framework Agnostic** - Works with React, Vue, Next.js, Node.js
- ✅ **Quick Setup** - Less than 10 lines to integrate
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Production Ready** - Comprehensive testing and documentation

### 2. Private Green Travel Rewards (Demo Application)

A **real-world example dApp** demonstrating SDK capabilities through an anonymous rewards system for sustainable transportation:

- 🔐 **Complete Privacy** - Carbon savings encrypted with FHE
- 🏆 **Tiered Rewards** - Bronze/Silver/Gold based on encrypted data
- ⏱️ **Weekly Periods** - Automated reward cycles
- 🔄 **Zero-Knowledge Processing** - Rewards calculated without decryption
- 💰 **Instant Claims** - Users withdraw accumulated tokens
- 🧪 **Production-Grade** - 54 comprehensive tests with 95%+ coverage

---

## 🎯 Core Concepts

### What is Fully Homomorphic Encryption (FHE)?

FHE allows computations on encrypted data **without decrypting it first**. This enables:

- **Privacy by Default** - Sensitive data never exposed on-chain
- **Confidential Smart Contracts** - Process encrypted inputs and produce encrypted outputs
- **Zero-Knowledge Computation** - Results verifiable without revealing inputs

### How This Project Uses FHE

**Problem:** Traditional blockchain is transparent - all data is public. Users can't participate in incentive programs without revealing personal information (carbon savings, travel patterns).

**Solution:** Using Zama FHEVM, users encrypt their carbon savings client-side before submission. The smart contract:
1. Stores encrypted data on-chain
2. Performs homomorphic operations (comparisons, additions) on encrypted values
3. Calculates tier levels without ever seeing plaintext values
4. Distributes rewards while maintaining complete privacy

**Real-World Application:** Anonymous environmental incentives where users earn rewards for green behavior without exposing their actual carbon reduction amounts or travel patterns.

---

## 🚀 Live Deployment

**🌐 Application:** [https://fhe-green-travel-rewards.vercel.app/](https://fhe-green-travel-rewards.vercel.app/)

**📋 Smart Contract:** `0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B` (Sepolia Testnet)

**🔗 Verified Contract:** [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B)

**📦 SDK Repository:** [https://github.com/RileyLueilwitz/fhevm-react-template](https://github.com/RileyLueilwitz/fhevm-react-template)

**🎮 Main Repository:** [https://github.com/RileyLueilwitz/FHEGreenTravelRewards](https://github.com/RileyLueilwitz/FHEGreenTravelRewards)

---

## 📦 Universal FHEVM SDK

### Quick Start

Install the SDK:

```bash
npm install @fhevm/sdk ethers
```

### Vanilla JavaScript Usage

```javascript
import { createFhevmInstance, encrypt } from '@fhevm/sdk'

// 1. Initialize FHEVM
const fhevm = await createFhevmInstance({ network: 'sepolia' })

// 2. Encrypt data
const encrypted = await encrypt(fhevm, 42, 'uint32')

// 3. Submit to contract
await contract.submitData(encrypted)
```

**That's it! FHE encryption in 3 lines.**

### React Integration

```jsx
// Wrap your app
import { FhevmProvider } from '@fhevm/sdk/react'

<FhevmProvider config={{ network: 'sepolia' }}>
  <App />
</FhevmProvider>

// Use in components
import { useEncrypt } from '@fhevm/sdk/react'

function MyComponent() {
  const { encrypt } = useEncrypt()

  const handleSubmit = async (value) => {
    const encrypted = await encrypt(value, 'uint32')
    await contract.submitData(encrypted)
  }
}
```

### Next.js Integration

```jsx
// pages/_app.jsx
import { FhevmProvider } from '@fhevm/sdk/react'

export default function App({ Component, pageProps }) {
  return (
    <FhevmProvider config={{ network: 'sepolia' }}>
      <Component {...pageProps} />
    </FhevmProvider>
  )
}
```

### SDK Features

- **Core Functions:** `createFhevmInstance`, `encrypt`, `decrypt`, `encryptBatch`
- **React Hooks:** `useFhevmInstance`, `useEncrypt`, `useDecrypt`
- **Utilities:** EIP-712 signing, ACL management, validation
- **Types:** Full TypeScript support with type definitions
- **Documentation:** Complete API reference and integration guides

---

## 🏗️ Private Green Travel Rewards Architecture

### Smart Contract Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                           │
│  MetaMask Wallet + FHEVM SDK → Client-side Encryption       │
└────────────────────────┬─────────────────────────────────────┘
                         │ Encrypted Carbon Data (euint32)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               SMART CONTRACT (Sepolia)                        │
│  PrivateGreenTravelRewards.sol                               │
│  ├── submitTravelData(bytes encryptedAmount)                │
│  │   └── Store encrypted CO2 savings                        │
│  ├── processPeriod() - FHE Operations                       │
│  │   ├── FHE.add(encrypted values)                          │
│  │   ├── FHE.ge(comparison for tiers)                       │
│  │   └── Calculate rewards on encrypted data                │
│  └── claimRewards() - Distribute tokens                     │
└────────────────────────┬─────────────────────────────────────┘
                         │ Decryption Request (ACL-protected)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   ZAMA FHEVM NETWORK                          │
│  ├── Homomorphic computation (no plaintext exposure)        │
│  ├── Oracle-based decryption (owner authorization)          │
│  └── Callback with results                                  │
└──────────────────────────────────────────────────────────────┘
```

### Reward Tiers

Calculated entirely on encrypted data:

- 🥉 **Bronze Tier** - Encrypted savings ≥ 1,000g CO2e → 10 tokens
- 🥈 **Silver Tier** - Encrypted savings ≥ 5,000g CO2e → 25 tokens
- 🥇 **Gold Tier** - Encrypted savings ≥ 10,000g CO2e → 50 tokens

The smart contract performs tier comparisons using FHE operations without ever knowing the actual carbon values.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js v18.x or v20.x
- npm (v8.x or higher)
- MetaMask wallet
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone the main repository
git clone https://github.com/RileyLueilwitz/FHEGreenTravelRewards.git
cd FHEGreenTravelRewards

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys:
# - SEPOLIA_RPC_URL
# - PRIVATE_KEY
# - ETHERSCAN_API_KEY
```

### Running the SDK Examples

```bash
# Build the SDK package
npm run build:sdk

# Run Next.js example
npm run dev:nextjs
# Opens on http://localhost:3000

# Run React (Vite) example
npm run dev:react
# Opens on http://localhost:3001
```

### Smart Contract Development

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Deploy to Sepolia
npm run deploy

# Verify on Etherscan
npm run verify
```

---

## 📁 Project Structure

```
├── fhevm-react-template/          # SDK and examples monorepo
│   ├── packages/
│   │   └── fhevm-sdk/            # Universal FHEVM SDK
│   │       ├── src/
│   │       │   ├── core/         # Framework-agnostic functions
│   │       │   ├── react/        # React hooks and provider
│   │       │   └── utils/        # Utilities
│   │       └── package.json
│   │
│   ├── examples/
│   │   ├── nextjs/               # Next.js 14 example
│   │   └── react/                # React + Vite example
│   │
│   ├── docs/                     # Comprehensive documentation
│   │   ├── SDK_DOCUMENTATION.md
│   │   ├── QUICK_START.md
│   │   ├── ARCHITECTURE.md
│   │   └── INTEGRATION.md
│   │
│   └── .github/workflows/        # CI/CD pipelines
│
├── contracts/                    # Smart contracts
│   └── PrivateGreenTravelRewards.sol
│
├── scripts/                      # Deployment and interaction
│   ├── deploy.js
│   ├── verify.js
│   ├── interact.js
│   └── simulate.js
│
├── test/                         # Comprehensive test suite
│   └── PrivateGreenTravelRewards.comprehensive.test.js
│
├── hardhat.config.js
├── package.json
└── demo.mp4                      # Demonstration video
```

---

## 🧪 Testing

### Test Coverage

```bash
npm run test:coverage
```

**Results:**
- **54 comprehensive tests** - All passing
- **95%+ code coverage** - Statements, branches, functions, lines
- **Edge cases tested** - Boundary conditions, error handling, security

### Test Categories

1. **Deployment Tests** - Contract initialization, period setup
2. **Encryption Tests** - Data submission, storage verification
3. **Period Management** - Cycle progression, status tracking
4. **Reward Calculation** - Tier assignment, homomorphic operations
5. **Claim Tests** - Token distribution, balance updates
6. **Access Control** - Owner functions, participant restrictions
7. **Security Tests** - Reentrancy, overflow, unauthorized access
8. **Gas Optimization** - Transaction costs, storage efficiency

---

## 🔒 Security

### Security Measures

- ✅ **Access Control** - Owner-only administrative functions
- ✅ **Reentrancy Protection** - Guards on all external calls
- ✅ **Input Validation** - Comprehensive parameter checking
- ✅ **Overflow Protection** - Solidity 0.8.x built-in checks
- ✅ **ACL-Based Decryption** - Zama's permission system
- ✅ **Automated Audits** - Solhint, ESLint, npm audit

### Security Audits

```bash
# Run security checks
npm run security

# Lint Solidity code
npm run lint:sol

# Check dependencies
npm run security:audit
```

---

## 📚 Documentation

### SDK Documentation

Complete guides available in `/fhevm-react-template/docs/`:

- **[SDK_DOCUMENTATION.md](./fhevm-react-template/docs/SDK_DOCUMENTATION.md)** - Full API reference
- **[QUICK_START.md](./fhevm-react-template/docs/QUICK_START.md)** - Get started in 5 minutes
- **[ARCHITECTURE.md](./fhevm-react-template/docs/ARCHITECTURE.md)** - Design patterns and structure
- **[INTEGRATION.md](./fhevm-react-template/docs/INTEGRATION.md)** - Framework-specific examples

### Project Documentation

- **[PROJECT_OVERVIEW.md](./fhevm-react-template/PROJECT_OVERVIEW.md)** - Detailed project architecture
- **[SETUP_GUIDE.md](./fhevm-react-template/SETUP_GUIDE.md)** - Installation and deployment
- **[DEMO_SCRIPT.md](./fhevm-react-template/DEMO_SCRIPT.md)** - Video demonstration guide

---

## 🌐 Deployment

### Live Application

**URL:** [https://fhe-green-travel-rewards.vercel.app/](https://fhe-green-travel-rewards.vercel.app/)

**Features:**
- Connect MetaMask wallet
- Submit encrypted carbon savings
- View SDK status and public key
- Real-time transaction feedback
- Responsive design

### Smart Contract

**Network:** Sepolia Testnet
**Contract Address:** `0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B`
**Verification:** [Etherscan Link](https://sepolia.etherscan.io/address/0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B)

**Contract Features:**
- FHE-based encryption storage
- Homomorphic tier calculation
- Weekly reward periods
- Token distribution system

---

## 🤝 Contributing

We welcome contributions to both the SDK and the example application!

### Development Workflow

```bash
# Fork and clone
git clone https://github.com/RileyLueilwitz/FHEGreenTravelRewards.git
cd FHEGreenTravelRewards

# Install dependencies
npm install

# Make changes to SDK
cd fhevm-react-template/packages/fhevm-sdk
# Edit src/ files

# Test changes
npm test

# Build SDK
npm run build

# Test in examples
cd ../../examples/react
npm install
npm run dev
```

### Areas for Contribution

- 🔧 **SDK Core** - Improve encryption/decryption performance
- ⚛️ **Framework Adapters** - Add Vue, Svelte, Angular support
- 📚 **Documentation** - Expand guides and tutorials
- 🧪 **Testing** - Add more test cases and scenarios
- 🎨 **Examples** - Build additional demo applications

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

**Special Thanks:**

- **Zama Team** - For FHEVM technology and the Universal SDK bounty opportunity
- **Ethereum Community** - For robust tooling and infrastructure
- **Open Source Contributors** - For inspiration and support

---

## 🔗 Links & Resources

### Project Links

- **Live Demo:** [https://fhe-green-travel-rewards.vercel.app/](https://fhe-green-travel-rewards.vercel.app/)
- **Main Repository:** [https://github.com/RileyLueilwitz/FHEGreenTravelRewards](https://github.com/RileyLueilwitz/FHEGreenTravelRewards)
- **SDK Repository:** [https://github.com/RileyLueilwitz/fhevm-react-template](https://github.com/RileyLueilwitz/fhevm-react-template)
- **Smart Contract:** [0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B](https://sepolia.etherscan.io/address/0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B)

### Zama Resources

- **Zama Documentation:** [https://docs.zama.ai](https://docs.zama.ai)
- **fhEVM GitHub:** [https://github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm)
- **Discord Community:** [Join Zama Discord](https://discord.gg/zama)

---

**⭐ Star us on GitHub if this project helps your FHE development journey!**

**Built with ❤️ for privacy-preserving web3 applications | Universal FHEVM SDK + Real-World Demo**

---

**Version:** 1.0.0
**Last Updated:** October 26, 2025
**Status:** Production Ready ✅
**Bounty:** Zama FHEVM Universal SDK Challenge
