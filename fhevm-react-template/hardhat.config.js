require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      evmVersion: "cancun",
      viaIR: false,
      metadata: {
        bytecodeHash: "ipfs",
        appendCBOR: true
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"]
        }
      }
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      mining: {
        auto: true,
        interval: 0
      },
      gasPrice: "auto",
      gas: "auto",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20
      }
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasPrice: "auto",
      gas: "auto",
      timeout: 60000
    },
    zama: {
      url: "https://devnet.zama.ai",
      accounts: [PRIVATE_KEY],
      chainId: 8009,
      timeout: 60000
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    token: "ETH",
    showTimeSpent: true,
    showMethodSig: true,
    maxMethodDiff: 10,
    excludeContracts: [],
    src: "./contracts"
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: process.env.CONTRACT_SIZER === "true",
    strict: true,
    only: [],
    except: []
  },
  mocha: {
    timeout: 40000,
    bail: false,
    allowUncaught: false,
    require: [],
    reporter: process.env.MOCHA_REPORTER || "spec"
  },
};

// Load custom Hardhat tasks
try {
  require("./tasks/accounts");
  require("./tasks/balance");
  require("./tasks/contract-info");
} catch (e) {
  // Tasks are optional
}