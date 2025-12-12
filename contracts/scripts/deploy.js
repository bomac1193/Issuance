const hre = require("hardhat");

async function main() {
  console.log("Deploying IssuanceRegistry...");

  const IssuanceRegistry = await hre.ethers.getContractFactory("IssuanceRegistry");
  const registry = await IssuanceRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`IssuanceRegistry deployed to: ${address}`);

  // Log for easy copy-paste to .env
  console.log(`\nAdd to backend/.env:`);
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
