const { ethers } = require('hardhat');
const { impersonateAccount, stopImpersonatingAccount } = require('@nomicfoundation/hardhat-network-helpers');

const usdcTokenAddr = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const maticTokenAddr = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0';
const usdcWhaleAddr = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
const maticWhaleAddr = '0x50d669F43b484166680Ecc3670E4766cdb0945CE';

async function getErc20Contract(tokenAddress) {
    return await ethers.getContractAt('../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', tokenAddress);
}

async function transferErc20Token(tokenAddress, srcAddress, dstAddress, amount) {
    console.log(tokenAddress);
    const tokenContract = await getErc20Contract(tokenAddress);
    console.log(await tokenContract.decimals());

    await impersonateAccount(srcAddress);
    const srcAddressSigner = await ethers.getSigner(srcAddress);
    await tokenContract.connect(srcAddressSigner).transfer(dstAddress, amount);
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(dstAddress);
    await stopImpersonatingAccount(srcAddress);
}

async function main() {
    await transferErc20Token(usdcTokenAddr, usdcWhaleAddr, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 100000000);
    await transferErc20Token(maticTokenAddr, maticWhaleAddr, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 100000000000000000000n);
    console.log(`Transfered 100 USDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
