const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH/SCAI");

  console.log("\n📦 Deploying VestToken...");
  const VestToken = await hre.ethers.getContractFactory("VestToken");
  const vestToken = await VestToken.deploy("VestToken", "VEST", 1000000, 18);
  await vestToken.waitForDeployment();
  const vestTokenAddress = await vestToken.getAddress();
  console.log("✅ VestToken deployed to:", vestTokenAddress);

  console.log("\n📦 Deploying TokenVesting...");
  const TokenVesting = await hre.ethers.getContractFactory("TokenVesting");
  const tokenVesting = await TokenVesting.deploy();
  await tokenVesting.waitForDeployment();
  const tokenVestingAddress = await tokenVesting.getAddress();
  console.log("✅ TokenVesting deployed to:", tokenVestingAddress);

  console.log("\n" + "=".repeat(60));
  console.log("  DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("  Network:         ", hre.network.name);
  console.log("  Deployer:        ", deployer.address);
  console.log("  VestToken:       ", vestTokenAddress);
  console.log("  TokenVesting:    ", tokenVestingAddress);
  console.log("=".repeat(60));

  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      VestToken: { address: vestTokenAddress, name: "VestToken", symbol: "VEST", decimals: 18, initialSupply: "1000000" },
      TokenVesting: { address: tokenVestingAddress },
    },
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
  const filename = `${deploymentsDir}/${hre.network.name}-deployment.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Deployment info saved to: ${filename}`);
}

main().then(() => process.exit(0)).catch((error) => { console.error("❌ Deployment failed:", error); process.exit(1); });
