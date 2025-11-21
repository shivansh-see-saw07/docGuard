const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const DocumentVerification = await hre.ethers.getContractFactory("DocumentVerification");
  const documentVerification = await DocumentVerification.deploy();

  await documentVerification.waitForDeployment();

  const address = await documentVerification.getAddress();
  console.log("DocumentVerification deployed to:", address);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  
  // For local networks, we can mine blocks
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    for (let i = 0; i < 5; i++) {
      await hre.network.provider.send("evm_mine");
    }
  } else {
    // For live networks, we just wait a bit
    console.log("Waiting for 30 seconds to ensure transaction is mined...");
    await new Promise(resolve => setTimeout(resolve, 30000));
  }

  // Verify the contract on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 