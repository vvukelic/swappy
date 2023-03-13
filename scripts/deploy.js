// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const TradeFactory = await ethers.getContractFactory("TradeFactory");
  const tradeFactory = await TradeFactory.deploy();
  await tradeFactory.deployed();

  console.log("TradeFactory address:", tradeFactory.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(tradeFactory);
}

function saveFrontendFiles(tradeFactory) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ TradeFactory: tradeFactory.address }, undefined, 2)
  );

  const TradeFactoryArtifact = artifacts.readArtifactSync("TradeFactory");

  fs.writeFileSync(
    path.join(contractsDir, "TradeFactory.json"),
    JSON.stringify(TradeFactoryArtifact, null, 2)
  );

  const TradeArtifact = artifacts.readArtifactSync("Trade");

  fs.writeFileSync(
    path.join(contractsDir, "Trade.json"),
    JSON.stringify(TradeArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
