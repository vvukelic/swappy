const { expect } = require('chai');
const { loadFixture, impersonateAccount, stopImpersonatingAccount, mine } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');
const { parseBytes32String } = require('ethers/lib/utils');
const usdcTokenAddr = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const maticTokenAddr = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0';
const wethTokenAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

async function getErc20Contract(tokenAddress) {
    return await ethers.getContractAt('../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', tokenAddress);
}

describe('SwapManager contract', function () {
    async function transferErc20Token(tokenAddress, srcAddress, dstAddress, amount) {
        const tokenContract = await getErc20Contract(tokenAddress);

        await impersonateAccount(srcAddress);
        const srcAddressSigner = await ethers.getSigner(srcAddress);
        await tokenContract.connect(srcAddressSigner).transfer(dstAddress, amount);
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(dstAddress);
        await stopImpersonatingAccount(srcAddress);
    }

    async function calculateTxCost(tx) {
        const fullTxInfo = await tx.wait();
        return fullTxInfo['cumulativeGasUsed'].toBigInt() * fullTxInfo['effectiveGasPrice'].toBigInt();
    }

    async function deploySwapManagerFixture() {
        const SwapManager = await ethers.getContractFactory('contracts/Swap.sol:SwapManager');
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const hardhatSwapManager = await SwapManager.deploy();

        await hardhatSwapManager.deployed();

        console.log('deployed');

        // transfer usdc to addr1
        await transferErc20Token(usdcTokenAddr, '0xF977814e90dA44bFA03b6295A0616a897441aceC', addr1.address, 100);

        console.log('first');

        // transfer matic to addr2
        await transferErc20Token(maticTokenAddr, '0x50d669F43b484166680Ecc3670E4766cdb0945CE', addr2.address, 100);

        console.log('second');

        return { SwapManager, hardhatSwapManager, owner, addr1, addr2, addr3 };
    }

    describe('Deployment', function () {
        it('Right owner', async function () {
            const { hardhatSwapManager, owner } = await loadFixture(deploySwapManagerFixture);
            expect(await hardhatSwapManager.owner()).to.equal(owner.address);
        });
    });

    describe('Swaps', function () {
        it('ERC20 -> ERC20 swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            const oldBalances = {
                usdcAddr1: (await usdcContract.balanceOf(addr1.address)).toBigInt(),
                maticAddr1: (await maticContract.balanceOf(addr1.address)).toBigInt(),
                usdcAddr2: (await usdcContract.balanceOf(addr2.address)).toBigInt(),
                maticAddr2: (await maticContract.balanceOf(addr2.address)).toBigInt(),
            };

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash);

            expect(await usdcContract.balanceOf(addr1.address)).to.equal(Number(oldBalances['usdcAddr1']) - 1);
            expect(await maticContract.balanceOf(addr1.address)).to.equal(Number(oldBalances['maticAddr1']) + 1);

            expect(await usdcContract.balanceOf(addr2.address)).to.equal(Number(oldBalances['usdcAddr2']) + 1);
            expect(await maticContract.balanceOf(addr2.address)).to.equal(Number(oldBalances['maticAddr2']) - 1);
        });

        it('ERC20 -> ETH swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);

            const oldBalances = {
                ethAddr1: (await ethers.provider.getBalance(addr1.address)).toBigInt(),
                usdcAddr1: (await usdcContract.balanceOf(addr1.address)).toBigInt(),
                ethAddr2: (await ethers.provider.getBalance(addr2.address)).toBigInt(),
                usdcAddr2: (await usdcContract.balanceOf(addr2.address)).toBigInt(),
            };

            const approveTx = await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);
            let addr1SpentGas = await calculateTxCost(approveTx);

            const swapEthValue = ethers.utils.parseUnits('1', 'ether').toBigInt();
            const swapTx = await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, ethers.constants.AddressZero, swapEthValue, 0);
            addr1SpentGas += await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            const takeSwapTx = await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapEthValue });
            const addr2SpentGas = await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'] + swapEthValue - addr1SpentGas);
            expect(await usdcContract.balanceOf(addr1.address)).to.equal(Number(oldBalances['usdcAddr1']) - 1);

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'] - swapEthValue - addr2SpentGas);
            expect(await usdcContract.balanceOf(addr2.address)).to.equal(Number(oldBalances['usdcAddr2']) + 1);
        });

        it('ETH -> ERC20 swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const maticContract = await getErc20Contract(maticTokenAddr);

            const oldBalances = {
                ethAddr1: (await ethers.provider.getBalance(addr1.address)).toBigInt(),
                maticAddr1: (await maticContract.balanceOf(addr1.address)).toBigInt(),
                ethAddr2: (await ethers.provider.getBalance(addr2.address)).toBigInt(),
                maticAddr2: (await maticContract.balanceOf(addr2.address)).toBigInt(),
            };

            const approveMaticTx = await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);
            let addr2SpentGas = await calculateTxCost(approveMaticTx);

            const swapEthValue = ethers.utils.parseUnits('1', 'ether').toBigInt();
            const swapTx = await hardhatSwapManager.connect(addr1).createSwap(ethers.constants.AddressZero, swapEthValue, maticTokenAddr, 1, 0, { value: swapEthValue });
            let addr1SpentGas = await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            const wethContract = await getErc20Contract(wethTokenAddr);
            const approveWethTx = await wethContract.connect(addr1).approve(hardhatSwapManager.address, swapEthValue);
            addr1SpentGas += await calculateTxCost(approveWethTx);

            const takeSwapTx = await hardhatSwapManager.connect(addr2).takeSwap(swapHash);
            addr2SpentGas += await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'] - swapEthValue - addr1SpentGas);
            expect(await maticContract.balanceOf(addr1.address)).to.equal(Number(oldBalances['maticAddr1']) + 1);

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'] + swapEthValue - addr2SpentGas);
            expect(await maticContract.balanceOf(addr2.address)).to.equal(Number(oldBalances['maticAddr2']) - 1);

            expect((await hardhatSwapManager.swaps(swapHash))['status']).to.equal(1);
        });

        it('Cancel a swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await hardhatSwapManager.connect(addr1).cancelSwap(swapHash);

            expect((await hardhatSwapManager.swaps(swapHash))['status']).to.equal(2);
        });

        it('Fail to take own swap', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await expect(hardhatSwapManager.connect(addr1).takeSwap(swapHash)).to.be.revertedWith('Cannot take own swap!');
        });

        it('Fail to take non-existent swap', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);

            const nonExistentSwapHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

            await expect(hardhatSwapManager.connect(addr1).takeSwap(nonExistentSwapHash)).to.be.revertedWith('Non existing swap!');
        });

        it("Fail to cancel someone else's swap", async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await expect(hardhatSwapManager.connect(addr2).cancelSwap(swapHash)).to.be.revertedWith('Only swap initiator can cancel a swap!');
        });

        it('Fail to cancel non-existent swap', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);

            const nonExistentSwapHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

            await expect(hardhatSwapManager.connect(addr1).cancelSwap(nonExistentSwapHash)).to.be.revertedWith('Non existing swap!');
        });

        it('Fail to take an already taken swap', async function () {
            const { hardhatSwapManager, addr1, addr2, addr3 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);
            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash);

            await expect(hardhatSwapManager.connect(addr3).takeSwap(swapHash)).to.be.revertedWith("Can't take swap that is not in OPENED status!");
        });

        it('Fail to take a canceled swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await hardhatSwapManager.connect(addr1).cancelSwap(swapHash);

            await expect(hardhatSwapManager.connect(addr2).takeSwap(swapHash)).to.be.revertedWith("Can't take swap that is not in OPENED status!");
        });

        it("Fail to cancel someone else's swap", async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await expect(hardhatSwapManager.connect(addr2).cancelSwap(swapHash)).to.be.revertedWith('Only swap initiator can cancel a swap!');
        });

        it('Should not allow creating a swap with a expiration date from past', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);
            const latestBlock = await hre.ethers.provider.getBlock('latest');

            const expiration = latestBlock['timestamp'] - 60;

            await expect(hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, expiration)).to.be.revertedWith('Swap expiration should be in the future!');
        });

        it('Should not allow taking an expired swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);
            const latestBlock = await hre.ethers.provider.getBlock('latest');

            const expiration = latestBlock['timestamp'] + 60;
            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, expiration);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await mine(100);

            await expect(hardhatSwapManager.connect(addr2).takeSwap(swapHash)).to.be.revertedWith('Swap has expired!');
        });

        it('Should allow taking a non-expired swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);
            const latestBlock = await hre.ethers.provider.getBlock('latest');

            const expiration = latestBlock['timestamp'] + 3600; // 1 hour from now
            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, expiration);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash);

            const swap = await hardhatSwapManager.swaps(swapHash);
            expect(swap.status).to.equal(1);
        });

        it('Retrieve swap details', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);

            let swapDetails = {
                srcToken: usdcTokenAddr,
                srcAmount: 1,
                dstToken: maticTokenAddr,
                dstAmount: 1,
            };

            if (swapDetails.srcToken === ethers.constants.AddressZero) {
                swapDetails.srcToken = wethTokenAddr;
            }

            const createSwapTx = await hardhatSwapManager.connect(addr1).createSwap(swapDetails.srcToken, swapDetails.srcAmount, swapDetails.dstToken, swapDetails.dstAmount, 0);
            await createSwapTx.wait();
            const [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            expect(swapObj['srcTokenAddress']).to.equal(swapDetails.srcToken);
            expect(swapObj['srcAddress']).to.equal(addr1.address);
            expect(swapObj['srcAmount'].toString()).to.equal(swapDetails.srcAmount.toString());
            expect(swapObj['dstTokenAddress']).to.equal(swapDetails.dstToken);
            expect(swapObj['dstAmount'].toString()).to.equal(swapDetails.dstAmount.toString());
            expect(swapObj['status']).to.equal(0); // 0 - OPEN status
        });
    });
});
