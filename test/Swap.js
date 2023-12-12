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

        // transfer usdc to addr1
        await transferErc20Token(usdcTokenAddr, '0xF977814e90dA44bFA03b6295A0616a897441aceC', addr1.address, 100000000);

        // transfer matic to addr2
        await transferErc20Token(maticTokenAddr, '0x50d669F43b484166680Ecc3670E4766cdb0945CE', addr2.address, 100000000);

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
            const { hardhatSwapManager, owner, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 100000, maticTokenAddr, 100000, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);
            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 100000);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 100000);

            const oldBalances = {
                usdcAddr1: (await usdcContract.balanceOf(addr1.address)),
                maticAddr1: (await maticContract.balanceOf(addr1.address)),
                usdcAddr2: (await usdcContract.balanceOf(addr2.address)),
                maticAddr2: (await maticContract.balanceOf(addr2.address)),
                initialOwnerBalance: (await usdcContract.balanceOf(owner.address)),
            };

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapObj.feeAmount });

            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(100000));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(100000));

            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(100000));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(100000));

            expect(await usdcContract.balanceOf(owner.address)).to.equal(Number(oldBalances['initialOwnerBalance']));

            expect((await hardhatSwapManager.swaps(swapHash))['status']).to.equal(1);
        });

        it('ERC20 -> ETH swap', async function () {
            const { hardhatSwapManager, owner, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);

            const oldBalances = {
                ethAddr1: (await ethers.provider.getBalance(addr1.address)),
                usdcAddr1: (await usdcContract.balanceOf(addr1.address)),
                ethAddr2: (await ethers.provider.getBalance(addr2.address)),
                usdcAddr2: (await usdcContract.balanceOf(addr2.address)),
                initialOwnerBalance: (await usdcContract.balanceOf(owner.address)),
            };

            const approveTx = await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 100000);
            let addr1SpentGas = await calculateTxCost(approveTx);

            const swapEthValue = ethers.utils.parseUnits('1', 'ether');
            const swapTx = await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 100000, ethers.constants.AddressZero, swapEthValue, ethers.constants.AddressZero, 0);
            addr1SpentGas += await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);
            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            const takeSwapTx = await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapEthValue.add(swapObj.feeAmount) });
            const addr2SpentGas = await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'].add(swapEthValue).sub(addr1SpentGas));
            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(100000));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].sub(swapEthValue).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(100000));

            expect(await usdcContract.balanceOf(owner.address)).to.equal(oldBalances['initialOwnerBalance']);

            expect((await hardhatSwapManager.swaps(swapHash))['status']).to.equal(1);
        });

        it('ETH -> ERC20 swap', async function () {
            const { hardhatSwapManager, owner, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const swapEthValue = ethers.utils.parseUnits('1', 'ether');

            const maticContract = await getErc20Contract(maticTokenAddr);
            const wethContract = await getErc20Contract(wethTokenAddr);

            const oldBalances = {
                ethAddr1: (await ethers.provider.getBalance(addr1.address)),
                maticAddr1: (await maticContract.balanceOf(addr1.address)),
                ethAddr2: (await ethers.provider.getBalance(addr2.address)),
                maticAddr2: (await maticContract.balanceOf(addr2.address)),
                initialOwnerBalance: (await wethContract.balanceOf(owner.address)),
            };

            const approveMaticTx = await maticContract.connect(addr2).approve(hardhatSwapManager.address, 100000);
            let addr2SpentGas = await calculateTxCost(approveMaticTx);

            const swapTx = await hardhatSwapManager.connect(addr1).createSwap(ethers.constants.AddressZero, swapEthValue, maticTokenAddr, 100000, ethers.constants.AddressZero, 0, { value: swapEthValue });
            let addr1SpentGas = await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);
            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            const approveWethTx = await wethContract.connect(addr1).approve(hardhatSwapManager.address, swapEthValue);
            addr1SpentGas += await calculateTxCost(approveWethTx);

            const takeSwapTx = await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapObj.feeAmount });
            addr2SpentGas += await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'].sub(swapEthValue).sub(addr1SpentGas));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(100000));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].add(swapEthValue).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(100000));

            expect(await wethContract.balanceOf(owner.address)).to.equal(oldBalances['initialOwnerBalance']);

            expect((await hardhatSwapManager.swaps(swapHash))['status']).to.equal(1);
        });

        it('Cancel a swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await hardhatSwapManager.connect(addr1).cancelSwap(swapHash);

            expect((await hardhatSwapManager.swaps(swapHash))['status']).to.equal(2);
        });

        it('Fail to take own swap', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
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

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
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

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);
            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);
            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapObj.feeAmount });

            await expect(hardhatSwapManager.connect(addr3).takeSwap(swapHash)).to.be.revertedWith("Can't take swap that is not in OPENED status!");
        });

        it('Fail to take a canceled swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await hardhatSwapManager.connect(addr1).cancelSwap(swapHash);

            await expect(hardhatSwapManager.connect(addr2).takeSwap(swapHash)).to.be.revertedWith("Can't take swap that is not in OPENED status!");
        });

        it("Fail to cancel someone else's swap", async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await expect(hardhatSwapManager.connect(addr2).cancelSwap(swapHash)).to.be.revertedWith('Only swap initiator can cancel a swap!');
        });

        it('Should not allow taking an expired swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);
            const latestBlock = await hre.ethers.provider.getBlock('latest');

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 60);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await mine(100);

            await expect(hardhatSwapManager.connect(addr2).takeSwap(swapHash)).to.be.revertedWith('Swap has expired!');
        });

        it('Should allow taking a non-expired swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const expiresIn = 3600; // 1 hour from now
            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, expiresIn);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);
            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapObj.feeAmount });

            const swap = await hardhatSwapManager.swaps(swapHash);
            expect(swap.status).to.equal(1);
        });

        it('Retrieve swap details', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);

            let swapDetails = {
                srcToken: usdcTokenAddr,
                srcAmount: 1000,
                dstToken: maticTokenAddr,
                dstAmount: 1000,
            };

            if (swapDetails.srcToken === ethers.constants.AddressZero) {
                swapDetails.srcToken = wethTokenAddr;
            }

            const createSwapTx = await hardhatSwapManager.connect(addr1).createSwap(swapDetails.srcToken, swapDetails.srcAmount, swapDetails.dstToken, swapDetails.dstAmount, ethers.constants.AddressZero, 0);
            await createSwapTx.wait();
            const [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            expect(swapObj['srcTokenAddress']).to.equal(swapDetails.srcToken);
            expect(swapObj['srcAddress']).to.equal(addr1.address);
            expect(swapObj['srcAmount'].toString()).to.equal(swapDetails.srcAmount.toString());
            expect(swapObj['dstTokenAddress']).to.equal(swapDetails.dstToken);
            expect(swapObj['dstAmount'].toString()).to.equal(swapDetails.dstAmount.toString());
            expect(swapObj['status']).to.equal(0); // 0 - OPENED status
        });

        it('Should allow taking a swap by the specified destination address', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, addr2.address, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);
            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapObj.feeAmount });

            // Validate that the swap has been taken successfully
            const swap = await hardhatSwapManager.swaps(swapHash);
            expect(swap.status).to.equal(1); // CLOSED status
        });

        it('Should fail to take a swap by an unauthorized address', async function () {
            const { hardhatSwapManager, addr1, addr2, addr3 } = await loadFixture(deploySwapManagerFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, addr2.address, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr3).approve(hardhatSwapManager.address, 1);

            await expect(hardhatSwapManager.connect(addr3).takeSwap(swapHash)).to.be.revertedWith('Only the specified destination address can take this swap!');
        });

        it('Should assign dstAddress to the swap in storage when taking the swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);
            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapObj.feeAmount });

            const swap = await hardhatSwapManager.getSwap(swapHash);
            expect(swap.dstAddress).to.equal(addr2.address);
        });

        it('Should push to dstUserSwaps if destination address is not set in createSwap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);
            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapObj.feeAmount });

            const dstUserSwapHash = await hardhatSwapManager.dstUserSwaps(addr2.address, 0);
            expect(dstUserSwapHash).to.equal(swapHash);
        });

        it('Should set createdTime on Swap creation', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);
            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            const swap = await hardhatSwapManager.getSwap(swapHash);

            const latestBlock = await ethers.provider.getBlock('latest');
            expect(latestBlock.timestamp - swap.createdTime).to.be.lt(10);
        });

        it('Should set closedTime on taking Swap', async function () {
            const { hardhatSwapManager, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);
            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);
            const swapObj = await hardhatSwapManager.getSwap(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).takeSwap(swapHash, { value: swapObj.feeAmount });

            const swap = await hardhatSwapManager.getSwap(swapHash);

            const latestBlock = await ethers.provider.getBlock('latest');
            expect(latestBlock.timestamp - swap.closedTime).to.be.lt(10);
        });

        it('Should set closedTime on canceling Swap', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);
            await hardhatSwapManager.connect(addr1).createSwap(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0);
            [swapHash] = await hardhatSwapManager.getUserSwaps(addr1.address);

            await hardhatSwapManager.connect(addr1).cancelSwap(swapHash);

            const swap = await hardhatSwapManager.getSwap(swapHash);

            const latestBlock = await ethers.provider.getBlock('latest');
            expect(latestBlock.timestamp - swap.closedTime).to.be.lt(10);
        });
    });
});
