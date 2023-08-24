const { ethers } = require('hardhat');

async function main() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    console.log(`Current block timestamp: ${block.timestamp}, number: ${blockNumber}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
