const { ethers } = require('hardhat');

async function mineBlocks(numberOfBlocks) {
    for (let i = 0; i < numberOfBlocks; i++) {
        await ethers.provider.send('evm_mine', []);
    }
}

async function main() {
    const blocksToMine = 10;
    await mineBlocks(blocksToMine);
    console.log(`Mined ${blocksToMine} blocks!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
