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

**Available in Two Versions:**
- **React + Vite + TypeScript** - Modern production application with @fhevm/sdk integration
- **Pure HTML/CSS/JS** - Legacy static version for reference and educational purposes

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

### Running the Applications

#### SDK Template Examples

```bash
# Build the SDK package
npm run build:sdk

# Run Next.js template
npm run dev:nextjs
# Opens on http://localhost:3000

# Run React (Vite) template
npm run dev:react
# Opens on http://localhost:3001

# Run Vue template
npm run dev:vue
# Opens on http://localhost:3002
```

#### Private Green Travel Rewards (React App)

```bash
# Navigate to the application
cd PrivateGreenTravelRewards

# Install dependencies
npm install

# Run development server
npm run dev
# Opens on http://localhost:3003

# Build for production
npm run build

# Preview production build
npm run preview
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
├── fhevm-react-template/          # SDK and templates monorepo
│   ├── packages/
│   │   └── fhevm-sdk/            # Universal FHEVM SDK
│   │       ├── src/
│   │       │   ├── core/         # Framework-agnostic functions
│   │       │   ├── react/        # React hooks and provider
│   │       │   ├── adapters/     # Vue & vanilla JS adapters
│   │       │   ├── types/        # TypeScript definitions
│   │       │   └── utils/        # Utilities
│   │       ├── package.json
│   │       └── tsconfig.json
│   │
│   ├── templates/                # Application templates
│   │   ├── nextjs/               # Next.js 14 template
│   │   ├── react/                # React + Vite template
│   │   ├── vue/                  # Vue 3 template
│   │   └── PrivateGreenTravelRewards/  # Full React app
│   │
│   ├── examples/                 # Usage code examples
│   │   ├── basic-encryption.ts
│   │   ├── react-hook-usage.tsx
│   │   └── contract-interaction.ts
│   │
│   ├── docs/                     # Comprehensive documentation
│   │   ├── SDK_DOCUMENTATION.md
│   │   ├── QUICK_START.md
│   │   ├── ARCHITECTURE.md
│   │   └── INTEGRATION.md
│   │
│   └── .github/workflows/        # CI/CD pipelines
│
├── PrivateGreenTravelRewards/    # Standalone React application
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── WalletSection.tsx
│   │   │   ├── PeriodStatus.tsx
│   │   │   ├── SubmissionForm.tsx
│   │   │   ├── UserStats.tsx
│   │   │   ├── AdminControls.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   └── LoadingOverlay.tsx
│   │   ├── config/               # Configuration
│   │   │   └── contract.ts
│   │   ├── App.tsx               # Main app component
│   │   ├── main.tsx              # Entry point
│   │   ├── App.css               # Component styles
│   │   └── index.css             # Global styles
│   ├── contracts/                # Smart contracts
│   │   └── PrivateGreenTravelRewards.sol
│   ├── public/                   # Legacy static version
│   ├── scripts/                  # Hardhat scripts
│   ├── vite.config.ts            # Vite configuration
│   ├── tsconfig.json             # TypeScript config
│   ├── hardhat.config.js         # Hardhat config
│   └── package.json              # Dependencies
│
├── contracts/                    # Shared smart contracts
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

## 🎨 Technology Stack

### Universal FHEVM SDK

**Core Technologies:**
- **TypeScript** 5.2+ - Full type safety and modern JavaScript features
- **Node.js** 18.x/20.x - Runtime environment
- **Build Tools** - Rollup for SDK bundling
- **Testing** - Jest + Hardhat testing framework

**SDK Components:**
- **Core** - Framework-agnostic encryption/decryption functions
- **React Hooks** - `useFhevmInstance`, `useEncrypt`, `useDecrypt`
- **Vue Composables** - `useFhevm` for Vue 3 Composition API
- **Vanilla Client** - `FhevmClient` for plain JavaScript
- **Utilities** - Validation, helpers, type definitions

### Private Green Travel Rewards Application

**Frontend Stack (React + Vite):**
- **React** 18.2.0 - Component-based UI library
- **TypeScript** 5.2.2 - Type-safe development
- **Vite** 5.0.8 - Lightning-fast build tool with HMR
- **@fhevm/sdk** - Universal FHEVM SDK integration
- **ethers.js** 6.9.0 - Ethereum interaction library

**Smart Contract Stack:**
- **Solidity** 0.8.24 - Smart contract language
- **Hardhat** 2.19.0 - Development environment
- **@fhevm/solidity** 0.5.0 - FHE operations library
- **Zama FHE** - Fully homomorphic encryption

**Development Tools:**
- **Vite DevServer** - Port 3003 with hot module replacement
- **TypeScript Compiler** - Strict type checking
- **React DevTools** - Component inspection
- **MetaMask** - Wallet integration

**Styling:**
- **Pure CSS3** - No framework dependencies
- **Glassmorphism** - Modern translucent design
- **CSS Variables** - Theming support
- **Responsive Design** - Mobile-first approach

**Deployment:**
- **Vercel** - Serverless hosting platform
- **Sepolia Testnet** - Ethereum test network
- **Etherscan** - Contract verification

### Key Architectural Improvements

**Original Version (Legacy):**
- Pure HTML5/CSS3/Vanilla JavaScript
- CDN-based ethers.js (v5.7.2)
- No build process
- Manual DOM manipulation
- Static file hosting

**New Version (React + Vite):**
- Modern React 18 with hooks
- TypeScript for type safety
- Vite for development speed (sub-second HMR)
- Component-based architecture
- @fhevm/sdk integration
- Production-optimized builds

**Benefits of Upgrade:**
- ✅ **Better Developer Experience** - Hot module replacement, TypeScript IntelliSense
- ✅ **Maintainability** - Component modularity, type safety
- ✅ **Performance** - Optimized production builds, code splitting
- ✅ **Scalability** - Easy to add new features and components
- ✅ **SDK Integration** - Native React hooks for FHE operations
- ✅ **Modern Tooling** - ESLint, Prettier, TypeScript compiler

### React Component Architecture

**Main Application Component:**
```
App.tsx
├── FhevmProvider (from @fhevm/sdk)
│   ├── WalletSection
│   │   └── Connect/display wallet status
│   ├── PeriodStatus
│   │   └── Display current period information
│   ├── SubmissionForm
│   │   └── Submit encrypted carbon savings
│   ├── UserStats
│   │   └── Display user statistics and rewards
│   ├── AdminControls
│   │   └── Period management (owner only)
│   ├── AboutSection
│   │   └── System information and features
│   └── LoadingOverlay
│       └── Transaction status feedback
```

**Component Responsibilities:**

1. **WalletSection** (`src/components/WalletSection.tsx`)
   - MetaMask connection
   - Address display with formatting
   - Network badge

2. **PeriodStatus** (`src/components/PeriodStatus.tsx`)
   - Period number display
   - Active/inactive status
   - Participant count
   - Time remaining countdown

3. **SubmissionForm** (`src/components/SubmissionForm.tsx`)
   - Carbon amount input
   - Reward tier information
   - Submit encrypted data via SDK
   - Form validation

4. **UserStats** (`src/components/UserStats.tsx`)
   - Total rewards earned
   - Lifetime carbon saved
   - Current period reward
   - Claim rewards functionality

5. **AdminControls** (`src/components/AdminControls.tsx`)
   - Start new period
   - End current period
   - Process participants
   - Owner-only display

6. **AboutSection** (`src/components/AboutSection.tsx`)
   - Privacy features explanation
   - How it works guide
   - Reward structure details

7. **LoadingOverlay** (`src/components/LoadingOverlay.tsx`)
   - Transaction loading state
   - Status messages
   - Spinner animation

**State Management:**
- React `useState` for local component state
- `useFhevmInstance` hook for FHEVM SDK instance
- `useEncrypt` hook for encryption operations
- ethers.js `Contract` for blockchain interaction

**Data Flow:**
```
User Input → React Component → @fhevm/sdk Hooks → Encryption →
Contract Call → Transaction → Event Listener → UI Update
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

**Technology Stack:**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **SDK:** @fhevm/sdk (Universal FHEVM SDK)
- **Web3:** ethers.js 6.9.0
- **Hosting:** Vercel (Serverless)

**Features:**
- ✅ Connect MetaMask wallet
- ✅ Submit encrypted carbon savings with FHE
- ✅ Real-time period status tracking
- ✅ Personal statistics dashboard
- ✅ Admin controls (for contract owner)
- ✅ Modern glassmorphism UI
- ✅ Fully responsive design
- ✅ TypeScript type safety

**Architecture:**
- **Frontend:** React components with modular structure
- **State Management:** React hooks + @fhevm/sdk hooks
- **Styling:** Pure CSS3 with CSS variables
- **Build Output:** Optimized static files (~45KB gzipped)

### Application Versions

**Two implementations available:**

1. **React + Vite Version (Production)** - `PrivateGreenTravelRewards/`
   - Modern React 18 with TypeScript
   - Component-based architecture
   - @fhevm/sdk integration
   - Vite for lightning-fast development
   - Currently deployed on Vercel

2. **Legacy Static Version** - `PrivateGreenTravelRewards/public/`
   - Pure HTML5/CSS3/JavaScript
   - No build process required
   - CDN-based dependencies
   - Simple deployment
   - Reference implementation

**Feature Comparison:**

| Feature | React + Vite | Static HTML |
|---------|--------------|-------------|
| **Framework** | React 18 + TypeScript | Vanilla JavaScript |
| **Build Tool** | Vite 5 | None (Static files) |
| **SDK Integration** | @fhevm/sdk hooks | Direct fhevmjs |
| **ethers.js** | v6.9.0 (npm) | v5.7.2 (CDN) |
| **Development Speed** | ⚡ HMR (<100ms) | 🔄 Full reload |
| **Type Safety** | ✅ TypeScript | ❌ None |
| **Component Architecture** | ✅ Modular | ❌ Monolithic |
| **Code Splitting** | ✅ Automatic | ❌ None |
| **Bundle Size** | ~45KB gzipped | ~150KB |
| **Browser Support** | Modern browsers | All browsers |
| **Deployment** | Build required | Direct upload |
| **Maintainability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Learning Curve** | Medium | Low |
| **Production Ready** | ✅ Yes | ✅ Yes |

### Smart Contract

**Network:** Sepolia Testnet
**Contract Address:** `0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B`
**Verification:** [Etherscan Link](https://sepolia.etherscan.io/address/0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B)

**Contract Features:**
- FHE-based encryption storage (euint32)
- Homomorphic tier calculation
- Weekly reward periods (7 days)
- Token distribution system
- Access control (owner-only functions)
- Event emission for UI updates

**Contract Statistics:**
- **Size:** 18.5 KB / 24 KB limit (77%)
- **Deployment Gas:** ~2.1M gas
- **Network:** Zama-enabled Sepolia testnet
- **Verification:** Fully verified on Etherscan

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

**Version:** 2.0.0
**Last Updated:** November 4, 2024
**Status:** Production Ready ✅
**Bounty:** Zama FHEVM Universal SDK Challenge

**Recent Updates:**
- ✨ **v2.0.0** - Upgraded PrivateGreenTravelRewards to React + Vite + TypeScript
- ⚡ Added @fhevm/sdk integration with React hooks
- 🎨 Implemented modular component architecture
- 📦 Enhanced SDK with Vue composables and vanilla JS adapters
- 🔧 Added comprehensive TypeScript type definitions
- 📚 Reorganized templates and usage examples
