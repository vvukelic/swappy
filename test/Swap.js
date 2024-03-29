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
        const [owner, feeAddr, addr1, addr2, addr3] = await ethers.getSigners();

        const hardhatSwapManager = await SwapManager.deploy(feeAddr.address);

        await hardhatSwapManager.deployed();

        // transfer usdc to addr1
        await transferErc20Token(usdcTokenAddr, '0xF977814e90dA44bFA03b6295A0616a897441aceC', addr1.address, 100000000);

        // transfer matic to addr2
        await transferErc20Token(maticTokenAddr, '0x50d669F43b484166680Ecc3670E4766cdb0945CE', addr2.address, 100000000);

        return { SwapManager, hardhatSwapManager, owner, feeAddr, addr1, addr2, addr3 };
    }

    describe('Deployment', function () {
        it('Right owner', async function () {
            const { hardhatSwapManager, owner } = await loadFixture(deploySwapManagerFixture);
            expect(await hardhatSwapManager.owner()).to.equal(owner.address);
        });
    });

    describe('Swaps', function () {
        it('ERC20 -> ERC20 swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);
            const srcAmount = 100000;
            const dstAmount = 100000;

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);
            expect(swapObj['status']).to.equal(0);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, srcAmount);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, dstAmount);

            const oldBalances = {
                usdcAddr1: (await usdcContract.balanceOf(addr1.address)),
                maticAddr1: (await maticContract.balanceOf(addr1.address)),
                usdcAddr2: (await usdcContract.balanceOf(addr2.address)),
                maticAddr2: (await maticContract.balanceOf(addr2.address)),
                initialOwnerBalance: (await usdcContract.balanceOf(owner.address)),
                initialFeeAddrBalance: (await ethers.provider.getBalance(feeAddr.address)),
            };

            await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, dstAmount, { value: swapObj.feeAmount });

            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(srcAmount));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(dstAmount));

            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(srcAmount));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(dstAmount));

            expect(await usdcContract.balanceOf(owner.address)).to.equal(Number(oldBalances['initialOwnerBalance']));
            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwapManager.getSwapsForOffer(swapHash);
            expect(swapsForOffer.length).to.equal(1);
        });

        it('ERC20 -> ETH swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);

            const oldBalances = {
                ethAddr1: (await ethers.provider.getBalance(addr1.address)),
                usdcAddr1: (await usdcContract.balanceOf(addr1.address)),
                ethAddr2: (await ethers.provider.getBalance(addr2.address)),
                usdcAddr2: (await usdcContract.balanceOf(addr2.address)),
                initialOwnerBalance: (await usdcContract.balanceOf(owner.address)),
                initialFeeAddrBalance: (await ethers.provider.getBalance(feeAddr.address)),
            };

            const srcAmount = 100000;
            const dstAmount = ethers.utils.parseUnits('1', 'ether');

            const approveTx = await usdcContract.connect(addr1).approve(hardhatSwapManager.address, srcAmount);
            let addr1SpentGas = await calculateTxCost(approveTx);

            const swapTx = await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, ethers.constants.AddressZero, dstAmount, ethers.constants.AddressZero, 0, false);
            addr1SpentGas += await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);

            const takeSwapTx = await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, dstAmount, { value: dstAmount.add(swapObj.feeAmount) });
            const addr2SpentGas = await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'].add(dstAmount).sub(addr1SpentGas));
            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(srcAmount));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].sub(dstAmount).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(srcAmount));

            expect(await usdcContract.balanceOf(owner.address)).to.equal(oldBalances['initialOwnerBalance']);
            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwapManager.getSwapsForOffer(swapHash);
            expect(swapsForOffer.length).to.equal(1);
        });

        it('ETH -> ERC20 swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const srcAmount = ethers.utils.parseUnits('1', 'ether');
            const dstAmount = 100000;

            const maticContract = await getErc20Contract(maticTokenAddr);
            const wethContract = await getErc20Contract(wethTokenAddr);

            const oldBalances = {
                ethAddr1: (await ethers.provider.getBalance(addr1.address)),
                maticAddr1: (await maticContract.balanceOf(addr1.address)),
                ethAddr2: (await ethers.provider.getBalance(addr2.address)),
                maticAddr2: (await maticContract.balanceOf(addr2.address)),
                initialOwnerBalance: (await wethContract.balanceOf(owner.address)),
                initialFeeAddrBalance: (await ethers.provider.getBalance(feeAddr.address)),
            };

            const approveMaticTx = await maticContract.connect(addr2).approve(hardhatSwapManager.address, dstAmount);
            let addr2SpentGas = await calculateTxCost(approveMaticTx);

            const swapTx = await hardhatSwapManager.connect(addr1).createSwapOffer(ethers.constants.AddressZero, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, false, { value: srcAmount });
            let addr1SpentGas = await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);

            const approveWethTx = await wethContract.connect(addr1).approve(hardhatSwapManager.address, srcAmount);
            addr1SpentGas += await calculateTxCost(approveWethTx);

            const takeSwapTx = await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, dstAmount, { value: swapObj.feeAmount });
            addr2SpentGas += await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'].sub(srcAmount).sub(addr1SpentGas));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(dstAmount));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].add(srcAmount).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(dstAmount));

            expect(await wethContract.balanceOf(owner.address)).to.equal(oldBalances['initialOwnerBalance']);
            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwapManager.getSwapsForOffer(swapHash);
            expect(swapsForOffer.length).to.equal(1);
        });

        it('Cancel a swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);

            await hardhatSwapManager.connect(addr1).cancelSwapOffer(swapHash);

            expect((await hardhatSwapManager.swapOffers(swapHash))['status']).to.equal(1);
        });

        it('Fail to take own swap', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);

            await expect(hardhatSwapManager.connect(addr1).createSwapForOffer(swapHash, 1)).to.be.revertedWith('Cannot create swap for own swap offer!');
        });

        it('Fail to take non-existent swap', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);

            const nonExistentSwapHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

            await expect(hardhatSwapManager.connect(addr1).createSwapForOffer(nonExistentSwapHash, 1)).to.be.revertedWith('Non existing swap offer!');
        });

        it("Fail to cancel someone else's swap", async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);

            await expect(hardhatSwapManager.connect(addr2).cancelSwapOffer(swapHash)).to.be.revertedWith('Only swap offer initiator can cancel a swap offer!');
        });

        it('Fail to cancel non-existent swap', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);

            const nonExistentSwapHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

            await expect(hardhatSwapManager.connect(addr1).cancelSwapOffer(nonExistentSwapHash)).to.be.revertedWith('Non existing swap offer!');
        });

        it('Fail to take an already taken swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2, addr3 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);
            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, 1, { value: swapObj.feeAmount });

            await expect(hardhatSwapManager.connect(addr3).createSwapForOffer(swapHash, 1)).to.be.revertedWith("There's not enough resources left in offer for this swap!");
        });

        it('Fail to take a canceled swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);

            await hardhatSwapManager.connect(addr1).cancelSwapOffer(swapHash);

            await expect(hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, 1)).to.be.revertedWith("Can't create swap for offer that is not in OPENED status!");
        });

        it("Fail to cancel someone else's swap", async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);

            await expect(hardhatSwapManager.connect(addr2).cancelSwapOffer(swapHash)).to.be.revertedWith('Only swap offer initiator can cancel a swap offer!');
        });

        it('Should not allow taking an expired swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);
            const latestBlock = await hre.ethers.provider.getBlock('latest');

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 60, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);

            await mine(100);

            await expect(hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, 1)).to.be.revertedWith('Swap offer has expired!');
        });

        it('Should allow taking a non-expired swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const expiresIn = 3600; // 1 hour from now
            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, expiresIn, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, 1, { value: swapObj.feeAmount });

            const swapsForOffer = await hardhatSwapManager.getSwapsForOffer(swapHash);
            expect(swapsForOffer[0].srcAmount).to.equal(1);
            expect(swapsForOffer[0].dstAmount).to.equal(1);
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

            const createSwapTx = await hardhatSwapManager.connect(addr1).createSwapOffer(swapDetails.srcToken, swapDetails.srcAmount, swapDetails.dstToken, swapDetails.dstAmount, ethers.constants.AddressZero, 0, false);
            await createSwapTx.wait();
            const [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);

            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);

            expect(swapObj['srcTokenAddress']).to.equal(swapDetails.srcToken);
            expect(swapObj['srcAddress']).to.equal(addr1.address);
            expect(swapObj['srcAmount'].toString()).to.equal(swapDetails.srcAmount.toString());
            expect(swapObj['dstTokenAddress']).to.equal(swapDetails.dstToken);
            expect(swapObj['dstAmount'].toString()).to.equal(swapDetails.dstAmount.toString());
            expect(swapObj['status']).to.equal(0); // 0 - OPENED status
        });

        it('Should allow taking a swap by the specified destination address', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, addr2.address, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, 1, { value: swapObj.feeAmount });

            // Validate that the swap has been taken successfully
            const swapsForOffer = await hardhatSwapManager.getSwapsForOffer(swapHash);
            expect(swapsForOffer[0].srcAmount).to.equal(1);
            expect(swapsForOffer[0].dstAmount).to.equal(1);
        });

        it('Should fail to take a swap by an unauthorized address', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2, addr3 } = await loadFixture(deploySwapManagerFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, 1);

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, addr2.address, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr3).approve(hardhatSwapManager.address, 1);

            await expect(hardhatSwapManager.connect(addr3).createSwapForOffer(swapHash, 1)).to.be.revertedWith('Only the specified destination address can take this swap offer!');
        });

        it('Should set createdTime on SwapOffer creation', async function () {
            const { hardhatSwapManager, addr1 } = await loadFixture(deploySwapManagerFixture);
            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);

            const swap = await hardhatSwapManager.getSwapOffer(swapHash);

            const latestBlock = await ethers.provider.getBlock('latest');
            expect(latestBlock.timestamp - swap.createdTime).to.be.lt(10);
        });
    });

    describe('Partial swaps', function () {
        it('ERC20 -> ERC20 partial swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);
            const srcAmount = 120000;
            const dstAmount = 970399;

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, true);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);
            expect(swapObj['status']).to.equal(0);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, srcAmount);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, dstAmount);

            const oldBalances = {
                usdcAddr1: await usdcContract.balanceOf(addr1.address),
                maticAddr1: await maticContract.balanceOf(addr1.address),
                usdcAddr2: await usdcContract.balanceOf(addr2.address),
                maticAddr2: await maticContract.balanceOf(addr2.address),
                initialFeeAddrBalance: await ethers.provider.getBalance(feeAddr.address),
            };

            const partialDstAmount = 40000;
            const expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });

            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(expectedSrcAmount));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(partialDstAmount));

            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(expectedSrcAmount));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(partialDstAmount));

            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwapManager.getSwapsForOffer(swapHash);
            const latestBlock = await ethers.provider.getBlock('latest');
            
            expect(swapsForOffer.length).to.equal(1);
            expect(swapsForOffer[0].srcAmount).to.equal(expectedSrcAmount);
            expect(swapsForOffer[0].dstAmount).to.equal(partialDstAmount);
            expect(latestBlock.timestamp - swapsForOffer[0].closedTime).to.be.lt(10);
        });

        it('ERC20 -> ETH partial swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);

            const oldBalances = {
                ethAddr1: await ethers.provider.getBalance(addr1.address),
                usdcAddr1: await usdcContract.balanceOf(addr1.address),
                ethAddr2: await ethers.provider.getBalance(addr2.address),
                usdcAddr2: await usdcContract.balanceOf(addr2.address),
                initialFeeAddrBalance: await ethers.provider.getBalance(feeAddr.address),
            };

            const srcAmount = 100000;
            const dstAmount = ethers.utils.parseUnits('1', 'ether');

            const approveTx = await usdcContract.connect(addr1).approve(hardhatSwapManager.address, srcAmount);
            let addr1SpentGas = await calculateTxCost(approveTx);

            const swapTx = await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, ethers.constants.AddressZero, dstAmount, ethers.constants.AddressZero, 0, true);
            addr1SpentGas += await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);

            const partialDstAmount = 40000;
            const expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            const takeSwapTx = await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount.add(partialDstAmount) });
            const addr2SpentGas = await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'].add(partialDstAmount).sub(addr1SpentGas));
            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(expectedSrcAmount));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].sub(partialDstAmount).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(expectedSrcAmount));

            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwapManager.getSwapsForOffer(swapHash);
            const latestBlock = await ethers.provider.getBlock('latest');

            expect(swapsForOffer.length).to.equal(1);
            expect(swapsForOffer[0].srcAmount).to.equal(expectedSrcAmount);
            expect(swapsForOffer[0].dstAmount).to.equal(partialDstAmount);
            expect(latestBlock.timestamp - swapsForOffer[0].closedTime).to.be.lt(10);
        });

        it('ETH -> ERC20 partial swap', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);

            const srcAmount = ethers.utils.parseUnits('1', 'ether');
            // const srcAmount = ethers.BigNumber.from(483289478);
            const dstAmount = ethers.BigNumber.from(100000);

            const maticContract = await getErc20Contract(maticTokenAddr);
            const wethContract = await getErc20Contract(wethTokenAddr);

            const approveMaticTx = await maticContract.connect(addr2).approve(hardhatSwapManager.address, dstAmount);

            const swapTx = await hardhatSwapManager.connect(addr1).createSwapOffer(ethers.constants.AddressZero, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, true, { value: srcAmount });
            let addr1SpentGas = await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);

            const oldBalances = {
                ethAddr1: await wethContract.balanceOf(addr1.address),
                maticAddr1: await maticContract.balanceOf(addr1.address),
                ethAddr2: await ethers.provider.getBalance(addr2.address),
                maticAddr2: await maticContract.balanceOf(addr2.address),
                initialFeeAddrBalance: await ethers.provider.getBalance(feeAddr.address),
            };

            const approveWethTx = await wethContract.connect(addr1).approve(hardhatSwapManager.address, srcAmount);
            addr1SpentGas += await calculateTxCost(approveWethTx);

            const partialDstAmount = ethers.BigNumber.from(12321);
            const expectedSrcAmount = partialDstAmount.mul(srcAmount).div(dstAmount);

            const takeSwapTx = await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });
            const addr2SpentGas = await calculateTxCost(takeSwapTx);

            expect(await wethContract.balanceOf(addr1.address)).to.equal(oldBalances['ethAddr1'].sub(expectedSrcAmount));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(partialDstAmount));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].add(expectedSrcAmount).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(partialDstAmount));

            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwapManager.getSwapsForOffer(swapHash);
            expect(swapsForOffer.length).to.equal(1);
        });

        it('ERC20 -> ERC20 partial swap (100% fill)', async function () {
            const { hardhatSwapManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwapManagerFixture);
            const srcAmount = 93029302;
            const dstAmount = 100000;

            await hardhatSwapManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, true);
            [swapHash] = await hardhatSwapManager.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwapManager.getSwapOffer(swapHash);
            expect(swapObj['status']).to.equal(0);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwapManager.address, srcAmount);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwapManager.address, dstAmount);

            const oldBalances = {
                usdcAddr1: await usdcContract.balanceOf(addr1.address),
                maticAddr1: await maticContract.balanceOf(addr1.address),
                usdcAddr2: await usdcContract.balanceOf(addr2.address),
                maticAddr2: await maticContract.balanceOf(addr2.address),
                initialFeeAddrBalance: await ethers.provider.getBalance(feeAddr.address),
            };

            let partialDstAmount = 40000;
            let expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });

            partialDstAmount = 40000;
            expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });

            partialDstAmount = 20000;
            expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            await hardhatSwapManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });

            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount.mul(3)));

            const swapsForOffer = await hardhatSwapManager.getSwapsForOffer(swapHash);
            const latestBlock = await ethers.provider.getBlock('latest');

            expect(swapsForOffer.length).to.equal(3);
            let srcAmountSum = ethers.BigNumber.from(0);
            let dstAmountSum = ethers.BigNumber.from(0);

            for (let i = 0; i < swapsForOffer.length; i++) {
                srcAmountSum = srcAmountSum.add(swapsForOffer[i].srcAmount);
                dstAmountSum = dstAmountSum.add(swapsForOffer[i].dstAmount);
            }

            expect(srcAmountSum).to.equal(srcAmount);
            expect(dstAmountSum).to.equal(dstAmount);
        });
    });
});
