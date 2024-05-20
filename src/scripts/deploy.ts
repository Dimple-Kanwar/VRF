// Imports
// ========================================================
import hre from "hardhat";

// Main Deployment Script
// ========================================================
async function main() {
  const contract = await hre.viem.deployContract("VRF");
  console.log(`VRF deployed to ${contract.address}`);
}

// Init
// ========================================================
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});