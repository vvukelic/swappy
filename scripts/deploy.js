const { ethers, network } = require('hardhat');
const path = require('path');


async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts to the ${network.name} network`);
    console.log(`Deployer: ${await deployer.getAddress()}`);
    console.log(`Deployer balance: ${(await deployer.getBalance()).toString()}`);

    let deployedAddresses = {};

    console.log('Deploying SwappyData...');
    const SwappyDataFactory = await ethers.getContractFactory('SwappyData');
    const swappyData = await SwappyDataFactory.deploy();
    await swappyData.deployed();
    console.log('SwappyData deployed to:', swappyData.address);
    deployedAddresses.SwappyData = swappyData.address;
    // const swappyData = await ethers.getContractAt('contracts/SwappyData.sol:SwappyData', '0x3EC0465705b4C0b5cB8E90072Bc586ADc2347123');

    console.log('Deploying SwappyManager...');
    const SwappyManagerFactory = await ethers.getContractFactory(`contracts/${network.name}/SwappyManager.sol:SwappyManager`);
    const swappyManager = await SwappyManagerFactory.deploy(deployedAddresses.SwappyData, '0x4A0245f825446e9CaFa51F1206bB0b961538441B');
    // const swappyManager = await SwappyManagerFactory.deploy('0x73C014A6EBaBadad4b9cC84Bbe238102FccD1A66', '0x4A0245f825446e9CaFa51F1206bB0b961538441B');
    await swappyManager.deployed();
    console.log('SwappyManager deployed to:', swappyManager.address);
    deployedAddresses.SwappyManager = swappyManager.address;

    console.log('Adding SwappyManager as a manager in SwappyData...');
    await swappyData.addManager(swappyManager.address);
    // await swappyData.addManager('0x469e5912a4472d49B43C1b34B0685693acc1CA29', { gasPrice: ethers.utils.parseUnits('8', 'gwei') });
    // await swappyData.removeManager('0x94FB120e084eBa847c94C7bb9f81c161053cc279');
    console.log('SwappyManager added as manager.');

    saveFrontendFiles(deployedAddresses);
}

function saveFrontendFiles(deployedAddresses) {
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

    if (!contractAddresses[network.name]) {
        contractAddresses[network.name] = deployedAddresses;
    } else {
        if (deployedAddresses.SwappyData) {
            contractAddresses[network.name].SwappyData = deployedAddresses.SwappyData;
        }
        
        if (deployedAddresses.SwappyManager) {
            contractAddresses[network.name].SwappyManager = deployedAddresses.SwappyManager;
        }
    }

    fs.writeFileSync(addressFilePath, JSON.stringify(contractAddresses, undefined, 2));

    const swappyDataArtifact = artifacts.readArtifactSync('SwappyData');
    fs.writeFileSync(path.join(contractsDir, 'SwappyData.json'), JSON.stringify(swappyDataArtifact.abi, null, 2));

    const swappyManagerArtifact = artifacts.readArtifactSync(`contracts/${network.name}/SwappyManager.sol:SwappyManager`);
    fs.writeFileSync(path.join(contractsDir, 'SwappyManager.json'), JSON.stringify(swappyManagerArtifact.abi, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
