const { network } = require('hardhat');
const path = require('path');

async function main() {
    // This is just a convenience check
    if (network.name === 'hardhat') {
        console.warn('You are trying to deploy a contract to the Hardhat Network, which' + 'gets automatically created and destroyed every time. Use the Hardhat' + " option '--network localhost'");
    }

    // ethers is available in the global scope
    const [deployer] = await ethers.getSigners();
    console.log('Network:', network.name);
    console.log('Deploying the contracts with the account:', await deployer.getAddress());
    console.log('Account balance:', (await deployer.getBalance()).toString());

    let contractPath = 'contracts/Swap.sol:SwapManager';
    
    if (network.name !== 'localhost' && network.name !== 'ethereum') {
        contractPath = `contracts/Swap_${network.name}.sol:SwapManager`;
    }

    const SwapFactory = await ethers.getContractFactory(contractPath);
    const swapFactory = await SwapFactory.deploy('0x4A0245f825446e9CaFa51F1206bB0b961538441B');
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
    const contractsDir = path.join(__dirname, '..', 'src', 'contracts');

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

    let contractPath = 'contracts/Swap.sol:SwapManager';

    if (network.name !== 'localhost' && network.name !== 'ethereum') {
        contractPath = `contracts/Swap_${network.name}.sol:SwapManager`;
    }

    const SwapFactoryArtifact = artifacts.readArtifactSync(contractPath);

    fs.writeFileSync(path.join(contractsDir, 'Swap.json'), JSON.stringify(SwapFactoryArtifact.abi, null, 2));
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
