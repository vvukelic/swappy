const { expect } = require("chai");
const { loadFixture, impersonateAccount, stopImpersonatingAccount } = require("@nomicfoundation/hardhat-network-helpers");
const usdcTokenAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const maticTokenAddr = "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0";

async function getErc20Contract(tokenAddress) {
    return await ethers.getContractAt("../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20", tokenAddress);;
}

describe("TradeFactory contract", function () {
    async function transferErc20Token(tokenAddress, srcAddress, dstAddress, amount) {
        const tokenContract = await getErc20Contract(tokenAddress)

        await impersonateAccount(srcAddress);
        const srcWhale = await ethers.getSigner(srcAddress);
        await tokenContract.connect(srcWhale).transfer(dstAddress, amount);
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(dstAddress);
        await stopImpersonatingAccount(srcAddress);
        // console.info(ethers.utils.formatUnits(balance, decimals));
    }

    async function deployTradeFactoryFixture() {
        const TradeFactory = await ethers.getContractFactory("TradeFactory");
        const [owner, addr1, addr2] = await ethers.getSigners();

        const hardhatTradeFactory = await TradeFactory.deploy();

        await hardhatTradeFactory.deployed();

        // transfer usdc to addr1
        await transferErc20Token(usdcTokenAddr, "0xF977814e90dA44bFA03b6295A0616a897441aceC", addr1.address, 7000000000);

        // transfer matic to addr2
        await transferErc20Token(maticTokenAddr, "0x50d669F43b484166680Ecc3670E4766cdb0945CE", addr2.address, 100000000000000000000n);

        return { TradeFactory, hardhatTradeFactory, owner, addr1, addr2 };
    }

    describe("Deployment", function () {
        it("Right owner", async function () {
            const { hardhatTradeFactory, owner } = await loadFixture(deployTradeFactoryFixture);
            expect(await hardhatTradeFactory.owner()).to.equal(owner.address);
        });
    });

    describe("Trades", function () {
        it("Create a trade", async function () {
            const { hardhatTradeFactory, addr1, addr2 } = await loadFixture(deployTradeFactoryFixture);

            const usdcContract = getErc20Contract(usdcTokenAddr);
            const trade = await hardhatTradeFactory.connect(addr1).createTrade(usdcTokenAddr, 1, maticTokenAddr, 1);
            // console.info(trade);

            [tradeAddress] = await hardhatTradeFactory.getDeployedTrades();
            const tradeContract = await ethers.getContractAt("../artifacts/contracts/Trade.sol:Trade", tradeAddress);
            expect(await tradeContract.srcAddress()).to.equal(addr1.address);
        });
    });

//   describe("Transactions", function () {
//     it("Should transfer tokens between accounts", async function () {
//       const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
//       // Transfer 50 tokens from owner to addr1
//       await expect(hardhatToken.transfer(addr1.address, 50))
//         .to.changeTokenBalances(hardhatToken, [owner, addr1], [-50, 50]);

//       // Transfer 50 tokens from addr1 to addr2
//       // We use .connect(signer) to send a transaction from another account
//       await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50))
//         .to.changeTokenBalances(hardhatToken, [addr1, addr2], [-50, 50]);
//     });

//     it("should emit Transfer events", async function () {
//       const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);

//       // Transfer 50 tokens from owner to addr1
//       await expect(hardhatToken.transfer(addr1.address, 50))
//         .to.emit(hardhatToken, "Transfer").withArgs(owner.address, addr1.address, 50)

//       // Transfer 50 tokens from addr1 to addr2
//       // We use .connect(signer) to send a transaction from another account
//       await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50))
//         .to.emit(hardhatToken, "Transfer").withArgs(addr1.address, addr2.address, 50)
//     });

//     it("Should fail if sender doesn't have enough tokens", async function () {
//       const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
//       const initialOwnerBalance = await hardhatToken.balanceOf(
//         owner.address
//       );

//       // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
//       // `require` will evaluate false and revert the transaction.
//       await expect(
//         hardhatToken.connect(addr1).transfer(owner.address, 1)
//       ).to.be.revertedWith("Not enough tokens");

//       // Owner balance shouldn't have changed.
//       expect(await hardhatToken.balanceOf(owner.address)).to.equal(
//         initialOwnerBalance
//       );
//     });
//   });
});
