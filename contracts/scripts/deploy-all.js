const hre = require("hardhat");

async function main() {
  console.log("Deploying all ISSUANCE contracts...\n");

  // Deploy IssuanceRegistry
  console.log("1. Deploying IssuanceRegistry...");
  const IssuanceRegistry = await hre.ethers.getContractFactory("IssuanceRegistry");
  const registry = await IssuanceRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`   IssuanceRegistry deployed to: ${registryAddress}`);

  // Deploy IssuanceFractions
  console.log("\n2. Deploying IssuanceFractions...");
  const IssuanceFractions = await hre.ethers.getContractFactory("IssuanceFractions");
  const fractions = await IssuanceFractions.deploy();
  await fractions.waitForDeployment();
  const fractionsAddress = await fractions.getAddress();
  console.log(`   IssuanceFractions deployed to: ${fractionsAddress}`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("Deployment Summary");
  console.log("=".repeat(50));
  console.log(`IssuanceRegistry:  ${registryAddress}`);
  console.log(`IssuanceFractions: ${fractionsAddress}`);
  console.log("\nAdd to backend/.env:");
  console.log(`CONTRACT_ADDRESS=${registryAddress}`);
  console.log(`FRACTIONS_CONTRACT_ADDRESS=${fractionsAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
