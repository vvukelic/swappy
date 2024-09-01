const { ethers, network } = require('hardhat');
const path = require('path');


async function main() {
    const fs = require('fs');
    const contractsDir = path.join(__dirname, '..', 'src', 'contracts');

    const addressFilePath = path.join(contractsDir, 'contract-address.json');
    const contractAddresses = JSON.parse(fs.readFileSync(addressFilePath));
    const feeAmountInCents = 100;

    const [admin] = await ethers.getSigners();
    console.log(`Changing fee on the ${network.name} network`);
    console.log(`Adimn: ${await admin.getAddress()}`);
    console.log(`Admin balance: ${(await admin.getBalance()).toString()}`);

    const swappyManager = await ethers.getContractAt(`contracts/${network.name}/SwappyManager.sol:SwappyManager`, contractAddresses[network.name].SwappyManager);
    await swappyManager.setFeeAmountInCents(feeAmountInCents);

    console.log(`Swappy fee set to ${feeAmountInCents}`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
