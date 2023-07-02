const path = require('path');

async function main() {
    // This is just a convenience check
    if (network.name === 'hardhat') {
        console.warn('You are trying to deploy a contract to the Hardhat Network, which' + 'gets automatically created and destroyed every time. Use the Hardhat' + " option '--network localhost'");
    }

    // ethers is available in the global scope
    const [deployer] = await ethers.getSigners();
    console.log('Deploying the contracts with the account:', await deployer.getAddress());

    console.log('Account balance:', (await deployer.getBalance()).toString());

    const SwapFactory = await ethers.getContractFactory('SwapManager');
    const swapFactory = await SwapFactory.deploy();
    await swapFactory.deployed();

    console.log('SwapManager address:', swapFactory.address);

    // We also save the contract's artifacts and address in the frontend directory
    saveFrontendFiles(swapFactory);
}

// function saveFrontendFiles(swapFactory) {
//     const fs = require('fs');
//     const contractsDir = path.join(__dirname, '..', 'frontend', 'src', 'contracts');

//     if (!fs.existsSync(contractsDir)) {
//         fs.mkdirSync(contractsDir);
//     }

//     fs.writeFileSync(path.join(contractsDir, 'contract-address.json'), JSON.stringify({ SwapManager: swapFactory.address }, undefined, 2));

//     const SwapFactoryArtifact = artifacts.readArtifactSync('SwapManager');

//     fs.writeFileSync(path.join(contractsDir, 'Swap.json'), JSON.stringify(SwapFactoryArtifact, null, 2));
// }

function saveFrontendFiles(swapFactory) {
    const fs = require('fs');
    const contractsDir = path.join(__dirname, '..', 'frontend', 'src', 'contracts');

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    // Load existing file or start with an empty object
    let contractAddresses = {};
    const addressFilePath = path.join(contractsDir, 'contract-address.json');

    if (fs.existsSync(addressFilePath)) {
        contractAddresses = JSON.parse(fs.readFileSync(addressFilePath));
    }

    // Add the current network and contract address
    if (!contractAddresses.SwapManager) {
        contractAddresses.SwapManager = {};
    }

    contractAddresses.SwapManager[network.name] = swapFactory.address;

    fs.writeFileSync(addressFilePath, JSON.stringify(contractAddresses, undefined, 2));

    const SwapFactoryArtifact = artifacts.readArtifactSync('SwapManager');

    fs.writeFileSync(path.join(contractsDir, 'Swap.json'), JSON.stringify(SwapFactoryArtifact.abi, null, 2));
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
