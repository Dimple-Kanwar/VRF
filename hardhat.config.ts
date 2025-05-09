import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";

const config: HardhatUserConfig = {
  defaultNetwork: "bscTestnet",
  networks: {
    // for local dev environment
    localhost: {
      url: "http://localhost:8545"
    },
    "berachain-local": {
      url: "http://localhost:8545",
      gasPrice: 1000000000,
    },
    // arbitrumSepolia: {
    //   url: "https://sepolia-rollup.arbitrum.io/rpc",
    //   accounts: [ `${process.env.ARBITRUM_PRIVATE_KEY}`]
    // },
    bscTestnet: {
      url: `${process.env.BSC_TESTNET_RPC_URL || ''}`,
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
    berachainTestnet: {
      chainId: parseInt(`${process.env.CHAIN_ID}`),
      url: `${process.env.BERACHAIN_RPC_URL || ''}`,
      accounts: process.env.WALLET_PRIVATE_KEY
        ? [`${process.env.WALLET_PRIVATE_KEY}`]
        : [],
        // gas: "auto",
      gasPrice: 10000000000,
      
    }
  },
  // etherscan: {
  //   apiKey: {
  //     berachainArtio: `${process.env.BLOCK_EXPLORER_API_KEY}`, // apiKey is not required, just set a placeholder
  //   },
  //   customChains: [
  //     {
  //       network: "Berachain Testnet",
  //       // chainId: parseInt(`${process.env.CHAIN_ID}`),
  //       urls: {
  //         apiURL: `${process.env.BLOCK_EXPLORER_API_URL}`,
  //         browserURL: `${process.env.BLOCK_EXPLORER_URL}`
  //       }
  //     },
  //   ]
  // },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./src/contracts",
    tests: "./src/test",
    cache: "./src/cache",
    artifacts: "./src/artifacts",
  },
  mocha: {
    timeout: 40000
  }
};

export default config;
