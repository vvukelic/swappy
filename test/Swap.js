const { expect } = require('chai');
const { loadFixture, impersonateAccount, stopImpersonatingAccount, mine } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');
const { parseBytes32String } = require('ethers/lib/utils');
const usdcTokenAddr = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const maticTokenAddr = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0';
const wethTokenAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const defaultAdminRole = ethers.constants.HashZero;

async function getErc20Contract(tokenAddress) {
    return await ethers.getContractAt('../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', tokenAddress);
}

describe('SwapManager contract', function () {
    async function transferErc20Token(tokenAddress, srcAddress, dstAddress, amount) {
        const tokenContract = await getErc20Contract(tokenAddress);

        await impersonateAccount(srcAddress);
        const srcAddressSigner = await ethers.getSigner(srcAddress);
        await tokenContract.connect(srcAddressSigner).transfer(dstAddress, amount);
        await stopImpersonatingAccount(srcAddress);
    }

    async function calculateTxCost(tx) {
        const fullTxInfo = await tx.wait();
        return fullTxInfo['cumulativeGasUsed'].toBigInt() * fullTxInfo['effectiveGasPrice'].toBigInt();
    }

    async function deploySwappyContractsFixture() {
        const SwappyData = await ethers.getContractFactory('contracts/SwappyData.sol:SwappyData');
        const hardhatSwappyData = await SwappyData.deploy();
        await hardhatSwappyData.deployed();

        const SwappyManager = await ethers.getContractFactory('contracts/localhost/SwappyManager.sol:SwappyManager');
        const [owner, feeAddr, addr1, addr2, addr3] = await ethers.getSigners();

        const hardhatSwappyManager = await SwappyManager.deploy(hardhatSwappyData.address, feeAddr.address);
        await hardhatSwappyManager.deployed();

        hardhatSwappyData.connect(owner).addManager(hardhatSwappyManager.address);

        // transfer usdc to addr1
        await transferErc20Token(usdcTokenAddr, '0xF977814e90dA44bFA03b6295A0616a897441aceC', addr1.address, 100000000);

        // transfer matic to addr2
        await transferErc20Token(maticTokenAddr, '0x50d669F43b484166680Ecc3670E4766cdb0945CE', addr2.address, 100000000);

        const defaultAdminRole = await hardhatSwappyData.DEFAULT_ADMIN_ROLE();
        const managerRole = await hardhatSwappyData.MANAGER_ROLE();

        return { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2, addr3, defaultAdminRole, managerRole };
    }

    function getSampleSwapOffer() {
        return {
            srcAddress: ethers.Wallet.createRandom().address,
            dstAddress: ethers.Wallet.createRandom().address,
            srcTokenAddress: ethers.Wallet.createRandom().address,
            srcAmount: ethers.utils.parseEther('10'),
            dstTokenAddress: ethers.Wallet.createRandom().address,
            dstAmount: ethers.utils.parseEther('10'),
            feeTokenAddress: ethers.Wallet.createRandom().address,
            feeAmount: ethers.utils.parseEther('0.01'),
            convertSrcTokenToNative: false,
            createdTime: Math.floor(Date.now() / 1000),
            expirationTime: Math.floor(Date.now() / 1000) + 86400,
            partialFillEnabled: false,
            status: 0,
        };
    }

    function getSampleSwapOfferHash() {
        return ethers.utils.keccak256(ethers.utils.toUtf8Bytes('example'));
    }

    describe('Deployment/access', function () {
        it('Deployer has the default admin role (SwappyData)', async function () {
            const { hardhatSwappyData, owner } = await loadFixture(deploySwappyContractsFixture);
            expect(await hardhatSwappyData.hasRole(defaultAdminRole, owner.address)).to.equal(true);
        });

        it('Deployer has the default admin role (SwappyManager)', async function () {
            const { hardhatSwappyManager, owner } = await loadFixture(deploySwappyContractsFixture);
            expect(await hardhatSwappyManager.hasRole(defaultAdminRole, owner.address)).to.equal(true);
        });

        it('Should allow adding a new manager', async function () {
            const { hardhatSwappyData, owner, addr1, managerRole } = await loadFixture(deploySwappyContractsFixture);
            await expect(hardhatSwappyData.connect(owner).addManager(addr1.address)).to.emit(hardhatSwappyData, 'RoleGranted').withArgs(managerRole, addr1.address, owner.address);
            expect(await hardhatSwappyData.hasRole(managerRole, addr1.address)).to.equal(true);
        });

        it('Should not allow non-admin to add a new manager', async function () {
            const { hardhatSwappyData, addr1, addr2, defaultAdminRole } = await loadFixture(deploySwappyContractsFixture);
            await expect(hardhatSwappyData.connect(addr1).addManager(addr2.address)).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${defaultAdminRole}`);
        });

        it('Should allow admin to remove a manager', async function () {
            const { hardhatSwappyData, owner, addr1, managerRole } = await loadFixture(deploySwappyContractsFixture);

            await hardhatSwappyData.connect(owner).addManager(addr1.address);

            await expect(hardhatSwappyData.connect(owner).removeManager(addr1.address)).to.emit(hardhatSwappyData, 'RoleRevoked').withArgs(managerRole, addr1.address, owner.address);
            expect(await hardhatSwappyData.hasRole(managerRole, addr1.address)).to.equal(false);
        });

        it('Should prevent non-admin from removing a manager', async function () {
            const { hardhatSwappyData, owner, addr1, defaultAdminRole } = await loadFixture(deploySwappyContractsFixture);

            await hardhatSwappyData.connect(owner).addManager(addr1.address);

            await expect(hardhatSwappyData.connect(addr1).removeManager(addr1.address)).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${defaultAdminRole}`);
        });

        it('Should not allow non-manager to add a swap offer', async function () {
            const { hardhatSwappyData, addr1, managerRole } = await loadFixture(deploySwappyContractsFixture);

            const swapOffer = getSampleSwapOffer();
            const swapOfferHash = getSampleSwapOfferHash();

            await expect(hardhatSwappyData.connect(addr1).addSwapOffer(swapOfferHash, swapOffer)).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${managerRole}`);
        });

        it('Should not allow non-manager to add a swap', async function () {
            const { hardhatSwappyData, addr1, managerRole } = await loadFixture(deploySwappyContractsFixture);

            const swap = {
                dstAddress: ethers.Wallet.createRandom().address,
                srcAmount: ethers.utils.parseEther('10'),
                dstAmount: ethers.utils.parseEther('10'),
                feeAmount: ethers.utils.parseEther('0.01'),
                closedTime: Math.floor(Date.now() / 1000),
            };
            const swapOfferHash = getSampleSwapOfferHash();

            await expect(hardhatSwappyData.connect(addr1).addSwap(swapOfferHash, swap)).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${managerRole}`);
        });

        it('Should not allow non-manager to add user swap offer', async function () {
            const { hardhatSwappyData, addr1, addr2, managerRole } = await loadFixture(deploySwappyContractsFixture);
            await expect(hardhatSwappyData.connect(addr1).addUserSwapOffer(addr2.address, getSampleSwapOfferHash())).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${managerRole}`);
        });

        it('Should not allow non-manager to add swap offer for user', async function () {
            const { hardhatSwappyData, addr1, addr2, managerRole } = await loadFixture(deploySwappyContractsFixture);
            await expect(hardhatSwappyData.connect(addr1).addSwapOfferForUser(addr2.address, getSampleSwapOfferHash())).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${managerRole}`);
        });

        it('Should not allow non-manager to add swap offer taken by user', async function () {
            const { hardhatSwappyData, addr1, addr2, managerRole } = await loadFixture(deploySwappyContractsFixture);
            await expect(hardhatSwappyData.connect(addr1).addSwapOfferTakenByUser(addr2.address, getSampleSwapOfferHash())).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${managerRole}`);
        });

        it('Should not allow non-manager to update swap offer status', async function () {
            const { hardhatSwappyData, addr1, addr2, managerRole } = await loadFixture(deploySwappyContractsFixture);
            await expect(hardhatSwappyData.connect(addr1).updateSwapOfferStatus(getSampleSwapOfferHash(), 1)).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${managerRole}`);
        });
    });

    describe('Swaps', function () {
        it('ERC20 -> ERC20 swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);
            const srcAmount = 100000;
            const dstAmount = 100000;

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);
            expect(swapObj['status']).to.equal(0);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwappyManager.address, srcAmount);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwappyManager.address, dstAmount);

            const oldBalances = {
                usdcAddr1: (await usdcContract.balanceOf(addr1.address)),
                maticAddr1: (await maticContract.balanceOf(addr1.address)),
                usdcAddr2: (await usdcContract.balanceOf(addr2.address)),
                maticAddr2: (await maticContract.balanceOf(addr2.address)),
                initialOwnerBalance: (await usdcContract.balanceOf(owner.address)),
                initialFeeAddrBalance: (await ethers.provider.getBalance(feeAddr.address)),
            };

            await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, dstAmount, { value: swapObj.feeAmount });

            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(srcAmount));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(dstAmount));

            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(srcAmount));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(dstAmount));

            expect(await usdcContract.balanceOf(owner.address)).to.equal(Number(oldBalances['initialOwnerBalance']));
            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwappyData.getSwapOfferSwaps(swapHash);
            expect(swapsForOffer.length).to.equal(1);
        });

        it('ERC20 -> ETH swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

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

            const approveTx = await usdcContract.connect(addr1).approve(hardhatSwappyManager.address, srcAmount);
            let addr1SpentGas = await calculateTxCost(approveTx);

            const swapTx = await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, ethers.constants.AddressZero, dstAmount, ethers.constants.AddressZero, 0, false);
            addr1SpentGas += await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);

            const takeSwapTx = await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, dstAmount, { value: dstAmount.add(swapObj.feeAmount) });
            const addr2SpentGas = await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'].add(dstAmount).sub(addr1SpentGas));
            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(srcAmount));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].sub(dstAmount).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(srcAmount));

            expect(await usdcContract.balanceOf(owner.address)).to.equal(oldBalances['initialOwnerBalance']);
            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwappyData.getSwapOfferSwaps(swapHash);
            expect(swapsForOffer.length).to.equal(1);
        });

        it('ETH -> ERC20 swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

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

            const approveMaticTx = await maticContract.connect(addr2).approve(hardhatSwappyManager.address, dstAmount);
            let addr2SpentGas = await calculateTxCost(approveMaticTx);

            const swapTx = await hardhatSwappyManager.connect(addr1).createSwapOffer(ethers.constants.AddressZero, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, false, { value: srcAmount });
            let addr1SpentGas = await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);

            const approveWethTx = await wethContract.connect(addr1).approve(hardhatSwappyManager.address, srcAmount);
            addr1SpentGas += await calculateTxCost(approveWethTx);

            const takeSwapTx = await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, dstAmount, { value: swapObj.feeAmount });
            addr2SpentGas += await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'].sub(srcAmount).sub(addr1SpentGas));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(dstAmount));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].add(srcAmount).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(dstAmount));

            expect(await wethContract.balanceOf(owner.address)).to.equal(oldBalances['initialOwnerBalance']);
            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwappyData.getSwapOfferSwaps(swapHash);
            expect(swapsForOffer.length).to.equal(1);
        });

        it('Cancel a swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);

            await hardhatSwappyManager.connect(addr1).cancelSwapOffer(swapHash);

            expect((await hardhatSwappyData.getSwapOffer(swapHash))['status']).to.equal(1);
        });

        it('Fail to take own swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, addr1 } = await loadFixture(deploySwappyContractsFixture);

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);

            await expect(hardhatSwappyManager.connect(addr1).createSwapForOffer(swapHash, 1)).to.be.revertedWith('Cannot create swap for own swap offer!');
        });

        it('Fail to take non-existent swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, addr1 } = await loadFixture(deploySwappyContractsFixture);

            const nonExistentSwapHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

            await expect(hardhatSwappyManager.connect(addr1).createSwapForOffer(nonExistentSwapHash, 1)).to.be.revertedWith('Non existing swap offer!');
        });

        it("Fail to cancel someone else's swap", async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);

            await expect(hardhatSwappyManager.connect(addr2).cancelSwapOffer(swapHash)).to.be.revertedWith('Only swap offer initiator can cancel a swap offer!');
        });

        it('Fail to cancel non-existent swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, addr1 } = await loadFixture(deploySwappyContractsFixture);

            const nonExistentSwapHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

            await expect(hardhatSwappyManager.connect(addr1).cancelSwapOffer(nonExistentSwapHash)).to.be.revertedWith('Non existing swap offer!');
        });

        it('Fail to take an already taken swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2, addr3 } = await loadFixture(deploySwappyContractsFixture);

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwappyManager.address, 1);
            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwappyManager.address, 1);

            await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, 1, { value: swapObj.feeAmount });

            await expect(hardhatSwappyManager.connect(addr3).createSwapForOffer(swapHash, 1)).to.be.revertedWith("There's not enough resources left in offer for this swap!");
        });

        it('Fail to take a canceled swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);

            await hardhatSwappyManager.connect(addr1).cancelSwapOffer(swapHash);

            await expect(hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, 1)).to.be.revertedWith("Can't create swap for offer that is not in OPENED status!");
        });

        it("Fail to cancel someone else's swap", async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);

            await expect(hardhatSwappyManager.connect(addr2).cancelSwapOffer(swapHash)).to.be.revertedWith('Only swap offer initiator can cancel a swap offer!');
        });

        it('Should not allow taking an expired swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);
            const latestBlock = await hre.ethers.provider.getBlock('latest');

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 60, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);

            await mine(100);

            await expect(hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, 1)).to.be.revertedWith('Swap offer has expired!');
        });

        it('Should allow taking a non-expired swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

            const expiresIn = 3600; // 1 hour from now
            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, expiresIn, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwappyManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwappyManager.address, 1);

            await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, 1, { value: swapObj.feeAmount });

            const swapsForOffer = await hardhatSwappyData.getSwapOfferSwaps(swapHash);
            expect(swapsForOffer[0].srcAmount).to.equal(1);
            expect(swapsForOffer[0].dstAmount).to.equal(1);
        });

        it('Retrieve swap details', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, addr1 } = await loadFixture(deploySwappyContractsFixture);

            let swapDetails = {
                srcToken: usdcTokenAddr,
                srcAmount: 1000,
                dstToken: maticTokenAddr,
                dstAmount: 1000,
            };

            if (swapDetails.srcToken === ethers.constants.AddressZero) {
                swapDetails.srcToken = wethTokenAddr;
            }

            const createSwapTx = await hardhatSwappyManager.connect(addr1).createSwapOffer(swapDetails.srcToken, swapDetails.srcAmount, swapDetails.dstToken, swapDetails.dstAmount, ethers.constants.AddressZero, 0, false);
            await createSwapTx.wait();
            const [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);

            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);

            expect(swapObj['srcTokenAddress']).to.equal(swapDetails.srcToken);
            expect(swapObj['srcAddress']).to.equal(addr1.address);
            expect(swapObj['srcAmount'].toString()).to.equal(swapDetails.srcAmount.toString());
            expect(swapObj['dstTokenAddress']).to.equal(swapDetails.dstToken);
            expect(swapObj['dstAmount'].toString()).to.equal(swapDetails.dstAmount.toString());
            expect(swapObj['status']).to.equal(0); // 0 - OPENED status
        });

        it('Should allow taking a swap by the specified destination address', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwappyManager.address, 1);

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, addr2.address, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwappyManager.address, 1);

            await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, 1, { value: swapObj.feeAmount });

            // Validate that the swap has been taken successfully
            const swapsForOffer = await hardhatSwappyData.getSwapOfferSwaps(swapHash);
            expect(swapsForOffer[0].srcAmount).to.equal(1);
            expect(swapsForOffer[0].dstAmount).to.equal(1);
        });

        it('Should fail to take a swap by an unauthorized address', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2, addr3 } = await loadFixture(deploySwappyContractsFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwappyManager.address, 1);

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, addr2.address, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr3).approve(hardhatSwappyManager.address, 1);

            await expect(hardhatSwappyManager.connect(addr3).createSwapForOffer(swapHash, 1)).to.be.revertedWith('Only the specified destination address can take this swap offer!');
        });

        it('Should set createdTime on SwapOffer creation', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, addr1 } = await loadFixture(deploySwappyContractsFixture);
            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, 1, maticTokenAddr, 1, ethers.constants.AddressZero, 0, false);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);

            const swap = await hardhatSwappyData.getSwapOffer(swapHash);

            const latestBlock = await ethers.provider.getBlock('latest');
            expect(latestBlock.timestamp - swap.createdTime).to.be.lt(10);
        });
    });

    describe('Partial swaps', function () {
        it('ERC20 -> ERC20 partial swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);
            const srcAmount = 120000;
            const dstAmount = 970399;

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, true);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);
            expect(swapObj['status']).to.equal(0);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwappyManager.address, srcAmount);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwappyManager.address, dstAmount);

            const oldBalances = {
                usdcAddr1: await usdcContract.balanceOf(addr1.address),
                maticAddr1: await maticContract.balanceOf(addr1.address),
                usdcAddr2: await usdcContract.balanceOf(addr2.address),
                maticAddr2: await maticContract.balanceOf(addr2.address),
                initialFeeAddrBalance: await ethers.provider.getBalance(feeAddr.address),
            };

            const partialDstAmount = 40000;
            const expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });

            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(expectedSrcAmount));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(partialDstAmount));

            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(expectedSrcAmount));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(partialDstAmount));

            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwappyData.getSwapOfferSwaps(swapHash);
            const latestBlock = await ethers.provider.getBlock('latest');
            
            expect(swapsForOffer.length).to.equal(1);
            expect(swapsForOffer[0].srcAmount).to.equal(expectedSrcAmount);
            expect(swapsForOffer[0].dstAmount).to.equal(partialDstAmount);
            expect(latestBlock.timestamp - swapsForOffer[0].closedTime).to.be.lt(10);
        });

        it('ERC20 -> ETH partial swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

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

            const approveTx = await usdcContract.connect(addr1).approve(hardhatSwappyManager.address, srcAmount);
            let addr1SpentGas = await calculateTxCost(approveTx);

            const swapTx = await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, ethers.constants.AddressZero, dstAmount, ethers.constants.AddressZero, 0, true);
            addr1SpentGas += await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);

            const partialDstAmount = 40000;
            const expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            const takeSwapTx = await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount.add(partialDstAmount) });
            const addr2SpentGas = await calculateTxCost(takeSwapTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances['ethAddr1'].add(partialDstAmount).sub(addr1SpentGas));
            expect(await usdcContract.balanceOf(addr1.address)).to.equal(oldBalances['usdcAddr1'].sub(expectedSrcAmount));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].sub(partialDstAmount).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await usdcContract.balanceOf(addr2.address)).to.equal(oldBalances['usdcAddr2'].add(expectedSrcAmount));

            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwappyData.getSwapOfferSwaps(swapHash);
            const latestBlock = await ethers.provider.getBlock('latest');

            expect(swapsForOffer.length).to.equal(1);
            expect(swapsForOffer[0].srcAmount).to.equal(expectedSrcAmount);
            expect(swapsForOffer[0].dstAmount).to.equal(partialDstAmount);
            expect(latestBlock.timestamp - swapsForOffer[0].closedTime).to.be.lt(10);
        });

        it('ETH -> ERC20 partial swap', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);

            const srcAmount = ethers.utils.parseUnits('1', 'ether');
            // const srcAmount = ethers.BigNumber.from(483289478);
            const dstAmount = ethers.BigNumber.from(100000);

            const maticContract = await getErc20Contract(maticTokenAddr);
            const wethContract = await getErc20Contract(wethTokenAddr);

            const approveMaticTx = await maticContract.connect(addr2).approve(hardhatSwappyManager.address, dstAmount);

            const swapTx = await hardhatSwappyManager.connect(addr1).createSwapOffer(ethers.constants.AddressZero, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, true, { value: srcAmount });
            let addr1SpentGas = await calculateTxCost(swapTx);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);

            const oldBalances = {
                ethAddr1: await wethContract.balanceOf(addr1.address),
                maticAddr1: await maticContract.balanceOf(addr1.address),
                ethAddr2: await ethers.provider.getBalance(addr2.address),
                maticAddr2: await maticContract.balanceOf(addr2.address),
                initialFeeAddrBalance: await ethers.provider.getBalance(feeAddr.address),
            };

            const approveWethTx = await wethContract.connect(addr1).approve(hardhatSwappyManager.address, srcAmount);
            addr1SpentGas += await calculateTxCost(approveWethTx);

            const partialDstAmount = ethers.BigNumber.from(12321);
            const expectedSrcAmount = partialDstAmount.mul(srcAmount).div(dstAmount);

            const takeSwapTx = await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });
            const addr2SpentGas = await calculateTxCost(takeSwapTx);

            expect(await wethContract.balanceOf(addr1.address)).to.equal(oldBalances['ethAddr1'].sub(expectedSrcAmount));
            expect(await maticContract.balanceOf(addr1.address)).to.equal(oldBalances['maticAddr1'].add(partialDstAmount));

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances['ethAddr2'].add(expectedSrcAmount).sub(addr2SpentGas).sub(swapObj.feeAmount));
            expect(await maticContract.balanceOf(addr2.address)).to.equal(oldBalances['maticAddr2'].sub(partialDstAmount));

            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount));

            const swapsForOffer = await hardhatSwappyData.getSwapOfferSwaps(swapHash);
            expect(swapsForOffer.length).to.equal(1);
        });

        it('ERC20 -> ERC20 partial swap (100% fill)', async function () {
            const { hardhatSwappyData, hardhatSwappyManager, owner, feeAddr, addr1, addr2 } = await loadFixture(deploySwappyContractsFixture);
            const srcAmount = 93029302;
            const dstAmount = 100000;

            await hardhatSwappyManager.connect(addr1).createSwapOffer(usdcTokenAddr, srcAmount, maticTokenAddr, dstAmount, ethers.constants.AddressZero, 0, true);
            [swapHash] = await hardhatSwappyData.getUserSwapOffers(addr1.address);
            const swapObj = await hardhatSwappyData.getSwapOffer(swapHash);
            expect(swapObj['status']).to.equal(0);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatSwappyManager.address, srcAmount);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatSwappyManager.address, dstAmount);

            const oldBalances = {
                usdcAddr1: await usdcContract.balanceOf(addr1.address),
                maticAddr1: await maticContract.balanceOf(addr1.address),
                usdcAddr2: await usdcContract.balanceOf(addr2.address),
                maticAddr2: await maticContract.balanceOf(addr2.address),
                initialFeeAddrBalance: await ethers.provider.getBalance(feeAddr.address),
            };

            let partialDstAmount = 40000;
            let expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });

            partialDstAmount = 40000;
            expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });

            partialDstAmount = 20000;
            expectedSrcAmount = Math.floor((partialDstAmount * srcAmount) / dstAmount);

            await hardhatSwappyManager.connect(addr2).createSwapForOffer(swapHash, partialDstAmount, { value: swapObj.feeAmount });

            expect(await ethers.provider.getBalance(feeAddr.address)).to.equal(oldBalances['initialFeeAddrBalance'].add(swapObj.feeAmount.mul(3)));

            const swapsForOffer = await hardhatSwappyData.getSwapOfferSwaps(swapHash);
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
