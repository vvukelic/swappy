const { expect } = require("chai");
const { loadFixture, impersonateAccount, stopImpersonatingAccount, mine } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const { parseBytes32String } = require("ethers/lib/utils");
const usdcTokenAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const maticTokenAddr = "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0";
const wethTokenAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

async function getErc20Contract(tokenAddress) {
    return await ethers.getContractAt("../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20", tokenAddress);;
}

describe("TradeManager contract", function () {
    async function transferErc20Token(tokenAddress, srcAddress, dstAddress, amount) {
        const tokenContract = await getErc20Contract(tokenAddress)

        await impersonateAccount(srcAddress);
        const srcAddressSigner = await ethers.getSigner(srcAddress);
        await tokenContract.connect(srcAddressSigner).transfer(dstAddress, amount);
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(dstAddress);
        await stopImpersonatingAccount(srcAddress);
    }

    async function calculateTxCost(tx) {
        const fullTxInfo = await tx.wait();
        return fullTxInfo["cumulativeGasUsed"].toBigInt() * fullTxInfo["effectiveGasPrice"].toBigInt();
    }

    async function deployTradeManagerFixture() {
        const TradeManager = await ethers.getContractFactory("contracts/TradeVar3.sol:TradeManager");
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const hardhatTradeManager = await TradeManager.deploy();

        await hardhatTradeManager.deployed();

        // transfer usdc to addr1
        await transferErc20Token(usdcTokenAddr, "0xF977814e90dA44bFA03b6295A0616a897441aceC", addr1.address, 100);

        // transfer matic to addr2
        await transferErc20Token(maticTokenAddr, "0x50d669F43b484166680Ecc3670E4766cdb0945CE", addr2.address, 100);

        return { TradeManager, hardhatTradeManager, owner, addr1, addr2, addr3 };
    }

    describe("Deployment", function () {
        it("Right owner", async function () {
            const { hardhatTradeManager, owner } = await loadFixture(deployTradeManagerFixture);
            expect(await hardhatTradeManager.owner()).to.equal(owner.address);
        });
    });

    describe("Trades", function () {
        it("ERC20 -> ERC20 trade", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);

            await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatTradeManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatTradeManager.address, 1);

            const oldBalances = {
                "usdcAddr1": (await usdcContract.balanceOf(addr1.address)).toBigInt(),
                "maticAddr1": (await maticContract.balanceOf(addr1.address)).toBigInt(),
                "usdcAddr2": (await usdcContract.balanceOf(addr2.address)).toBigInt(),
                "maticAddr2": (await maticContract.balanceOf(addr2.address)).toBigInt()
            };

            await hardhatTradeManager.connect(addr2).takeTrade(tradeHash);

            expect(await usdcContract.balanceOf(addr1.address)).to.equal(Number(oldBalances["usdcAddr1"]) - 1);
            expect(await maticContract.balanceOf(addr1.address)).to.equal(Number(oldBalances["maticAddr1"]) + 1);

            expect(await usdcContract.balanceOf(addr2.address)).to.equal(Number(oldBalances["usdcAddr2"]) + 1);
            expect(await maticContract.balanceOf(addr2.address)).to.equal(Number(oldBalances["maticAddr2"]) - 1);
        });

        it("ERC20 -> ETH trade", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);

            const usdcContract = await getErc20Contract(usdcTokenAddr);

            const oldBalances = {
                "ethAddr1": (await ethers.provider.getBalance(addr1.address)).toBigInt(),
                "usdcAddr1": (await usdcContract.balanceOf(addr1.address)).toBigInt(),
                "ethAddr2": (await ethers.provider.getBalance(addr2.address)).toBigInt(),
                "usdcAddr2": (await usdcContract.balanceOf(addr2.address)).toBigInt()
            };

            const approveTx = await usdcContract.connect(addr1).approve(hardhatTradeManager.address, 1);
            let addr1SpentGas = await calculateTxCost(approveTx);

            const tradeEthValue = ethers.utils.parseUnits("1","ether").toBigInt();
            const tradeTx = await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, ethers.constants.AddressZero, tradeEthValue, 0);
            addr1SpentGas += await calculateTxCost(tradeTx);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            const takeTradeTx = await hardhatTradeManager.connect(addr2).takeTrade(tradeHash, {value: tradeEthValue});
            const addr2SpentGas = await calculateTxCost(takeTradeTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances["ethAddr1"] + tradeEthValue - addr1SpentGas);
            expect(await usdcContract.balanceOf(addr1.address)).to.equal(Number(oldBalances["usdcAddr1"]) - 1);

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances["ethAddr2"] - tradeEthValue - addr2SpentGas);
            expect(await usdcContract.balanceOf(addr2.address)).to.equal(Number(oldBalances["usdcAddr2"]) + 1);
        });

        it("ETH -> ERC20 trade", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);

            const maticContract = await getErc20Contract(maticTokenAddr);

            const oldBalances = {
                "ethAddr1": (await ethers.provider.getBalance(addr1.address)).toBigInt(),
                "maticAddr1": (await maticContract.balanceOf(addr1.address)).toBigInt(),
                "ethAddr2": (await ethers.provider.getBalance(addr2.address)).toBigInt(),
                "maticAddr2": (await maticContract.balanceOf(addr2.address)).toBigInt()
            };

            const approveMaticTx = await maticContract.connect(addr2).approve(hardhatTradeManager.address, 1);
            let addr2SpentGas = await calculateTxCost(approveMaticTx);

            const tradeEthValue = ethers.utils.parseUnits("1","ether").toBigInt();
            const tradeTx = await hardhatTradeManager.connect(addr1).createTrade(ethers.constants.AddressZero, tradeEthValue, maticTokenAddr, 1, 0, {value: tradeEthValue});
            let addr1SpentGas = await calculateTxCost(tradeTx);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            const wethContract = await getErc20Contract(wethTokenAddr);
            const approveWethTx = await wethContract.connect(addr1).approve(hardhatTradeManager.address, tradeEthValue);
            addr1SpentGas += await calculateTxCost(approveWethTx);

            const takeTradeTx = await hardhatTradeManager.connect(addr2).takeTrade(tradeHash);
            addr2SpentGas += await calculateTxCost(takeTradeTx);

            expect(await ethers.provider.getBalance(addr1.address)).to.equal(oldBalances["ethAddr1"] - tradeEthValue - addr1SpentGas);
            expect(await maticContract.balanceOf(addr1.address)).to.equal(Number(oldBalances["maticAddr1"]) + 1);

            expect(await ethers.provider.getBalance(addr2.address)).to.equal(oldBalances["ethAddr2"] + tradeEthValue - addr2SpentGas);
            expect(await maticContract.balanceOf(addr2.address)).to.equal(Number(oldBalances["maticAddr2"]) - 1);

            expect((await hardhatTradeManager.trades(tradeHash))["status"]).to.equal(1);
        });

        it("Cancel a trade", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);

            await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            await hardhatTradeManager.connect(addr1).cancelTrade(tradeHash);

            expect((await hardhatTradeManager.trades(tradeHash))["status"]).to.equal(2);
        });

        it("Fail to take own trade", async function () {
            const { hardhatTradeManager, addr1 } = await loadFixture(deployTradeManagerFixture);

            await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            await expect(hardhatTradeManager.connect(addr1).takeTrade(tradeHash)).to.be.revertedWith("Cannot take own trade!");
        });

        it("Fail to take non-existent trade", async function () {
            const { hardhatTradeManager, addr1 } = await loadFixture(deployTradeManagerFixture);

            const nonExistentTradeHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

            await expect(hardhatTradeManager.connect(addr1).takeTrade(nonExistentTradeHash)).to.be.revertedWith("Non existing trade!");
        });

        it("Fail to cancel someone else's trade", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);

            await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            await expect(hardhatTradeManager.connect(addr2).cancelTrade(tradeHash)).to.be.revertedWith("Only trade initiator can cancel a trade!");
        });

        it("Fail to cancel non-existent trade", async function () {
            const { hardhatTradeManager, addr1 } = await loadFixture(deployTradeManagerFixture);

            const nonExistentTradeHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));

            await expect(hardhatTradeManager.connect(addr1).cancelTrade(nonExistentTradeHash)).to.be.revertedWith("Non existing trade!");
        });

        it("Fail to take an already taken trade", async function () {
            const { hardhatTradeManager, addr1, addr2, addr3 } = await loadFixture(deployTradeManagerFixture);

            await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatTradeManager.address, 1);
            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatTradeManager.address, 1);

            await hardhatTradeManager.connect(addr2).takeTrade(tradeHash);

            await expect(hardhatTradeManager.connect(addr3).takeTrade(tradeHash)).to.be.revertedWith("Can't take trade that is not in OPENED status!");
        });

        it("Fail to take a canceled trade", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);

            await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            await hardhatTradeManager.connect(addr1).cancelTrade(tradeHash);

            await expect(hardhatTradeManager.connect(addr2).takeTrade(tradeHash)).to.be.revertedWith("Can't take trade that is not in OPENED status!");
        });
        
        it("Fail to cancel someone else's trade", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);

            await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, 0);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            await expect(hardhatTradeManager.connect(addr2).cancelTrade(tradeHash)).to.be.revertedWith("Only trade initiator can cancel a trade!");
        });

        it("Should not allow creating a trade with a expiration date from past", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);
            const latestBlock = await hre.ethers.provider.getBlock("latest");

            const expiration = latestBlock["timestamp"] - 60;

            await expect(hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, expiration)).to.be.revertedWith("Trade expiration should be in the future!");
        });

        it("Should not allow taking an expired trade", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);
            const latestBlock = await hre.ethers.provider.getBlock("latest");

            const expiration = latestBlock["timestamp"] + 60;
            await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, expiration);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            await mine(100);

            await expect(hardhatTradeManager.connect(addr2).takeTrade(tradeHash)).to.be.revertedWith("Trade has expired!");
        });

        it("Should allow taking a non-expired trade", async function () {
            const { hardhatTradeManager, addr1, addr2 } = await loadFixture(deployTradeManagerFixture);
            const latestBlock = await hre.ethers.provider.getBlock("latest");

            const expiration = latestBlock["timestamp"] + 3600; // 1 hour from now
            await hardhatTradeManager.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1, expiration);
            [tradeHash] = await hardhatTradeManager.getUserTrades(addr1.address);

            const usdcContract = await getErc20Contract(usdcTokenAddr);
            await usdcContract.connect(addr1).approve(hardhatTradeManager.address, 1);

            const maticContract = await getErc20Contract(maticTokenAddr);
            await maticContract.connect(addr2).approve(hardhatTradeManager.address, 1);

            await hardhatTradeManager.connect(addr2).takeTrade(tradeHash);

            const trade = await hardhatTradeManager.trades(tradeHash);
            expect(trade.status).to.equal(1);
        });

    });
});
