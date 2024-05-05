import { ethers } from 'ethers';
import { getTokenByAddress } from './tokens';
import { sliceAddress } from './general';


class SwapOffer {
    constructor(blockchainUtil) {
        this.blockchainUtil = blockchainUtil;
    }

    getSwapOfferStatus() {
        if (this.status === 0) {
            if (this.filledPercentage === 100) {
                return 'FILLED';
            }

            if (!this.expirationTime.isZero() && this.expirationTime.lt(ethers.BigNumber.from(this.currentBlockTimestamp))) {
                return 'EXPIRED';
            } else if (this.srcAccountTokenBalance.lt(this.remainingSrcAmountSum)) {
                return 'ERROR';
            } else {
                return 'OPENED';
            }
        } else if (this.status === 1) {
            return 'CANCELED';
        }
    }

    getSwapsDstAmountSum() {
        let swapsDstAmountSum = ethers.BigNumber.from('0');

        for (let i = 0; i < this.swaps.length; i++) {
            swapsDstAmountSum = swapsDstAmountSum.add(this.swaps[i].dstAmount);
        }

        return swapsDstAmountSum;
    }

    calculateSrcAmountFromDstAmount(dstAmount) {
        return dstAmount.eq(this.dstAmount) ? this.srcAmount : Math.floor(dstAmount.mul(this.exchangeRate).div(this.scalingFactor));
    }

    async getSwaps() {
        const rawSwaps = await this.blockchainUtil.getSwapsForOffer(this.hash);
        const swaps = [];

        for (let i = 0; i < rawSwaps.length; i++) {
            const srcAmountInBaseUnit = ethers.utils.formatUnits(rawSwaps[i].srcAmount.toString(), this.srcTokenDecimals);
            const dstAmountInBaseUnit = ethers.utils.formatUnits(rawSwaps[i].dstAmount.toString(), this.dstTokenDecimals);
            const displayClosedTime = new Date(rawSwaps[i].closedTime * 1000).toLocaleString();
            const displayDstAddress = sliceAddress(rawSwaps[i].dstAddress);

            swaps.push({
                ...rawSwaps[i],
                srcAmountInBaseUnit,
                dstAmountInBaseUnit,
                displayClosedTime,
                displayDstAddress,
            });
        }

        swaps.sort((a, b) => b.closedTime - a.closedTime);

        return swaps;
    }

    async createCustomTokenFromAddress(tokenAddress) {
        try {
            const tokenName = await this.blockchainUtil.getTokenSymbol(tokenAddress);
            return {
                name: tokenName,
                networkSpecificAddress: {
                    [this.blockchainUtil.network.uniqueName]: tokenAddress,
                },
            };
        } catch (err) {
            console.error(err);
        }
    }

    getSrcToken() {
        return this.convertSrcTokenToNative ? this.blockchainUtil.nativeToken : this.srcToken;
    }

    async load(swapOfferHash) {
        const swapOffer = await this.blockchainUtil.getSwapOffer(swapOfferHash);
        this.hash = swapOfferHash;
        this.srcAddress = swapOffer.srcAddress;
        this.dstAddress = swapOffer.dstAddress;
        this.srcTokenAddress = swapOffer.srcTokenAddress;
        this.dstTokenAddress = swapOffer.dstTokenAddress;
        this.srcAmount = swapOffer.srcAmount;
        this.dstAmount = swapOffer.dstAmount;
        this.feeAmount = swapOffer.feeAmount;
        this.convertSrcTokenToNative = swapOffer.convertSrcTokenToNative;
        this.createdTime = swapOffer.createdTime;
        this.expirationTime = swapOffer.expirationTime;
        this.partialFillEnabled = swapOffer.partialFillEnabled;
        this.status = swapOffer.status;

        this.srcTokenDecimals = this.srcTokenAddress === ethers.constants.AddressZero ? 18 : await this.blockchainUtil.getTokenDecimals(this.srcTokenAddress);
        this.dstTokenDecimals = this.dstTokenAddress === ethers.constants.AddressZero ? 18 : await this.blockchainUtil.getTokenDecimals(this.dstTokenAddress);

        this.srcAddressUrl = `${this.blockchainUtil.network.blockExplorerUrls[0]}/address/${this.srcAddress}`;
        this.dstAddressUrl = `${this.blockchainUtil.network.blockExplorerUrls[0]}/address/${this.dstAddress}`;
        
        let srcToken = getTokenByAddress(this.srcTokenAddress, this.blockchainUtil.network.uniqueName);
        let dstToken = getTokenByAddress(this.dstTokenAddress, this.blockchainUtil.network.uniqueName);

        if (!srcToken) {
            srcToken = await this.createCustomTokenFromAddress(this.srcTokenAddress);
        }

        if (!dstToken) {
            dstToken = await this.createCustomTokenFromAddress(this.dstTokenAddress);
        }

        this.srcToken = srcToken;
        this.dstToken = dstToken;

        this.srcTokenSymbol = this.srcToken.symbol;
        this.dstTokenSymbol = this.dstToken.symbol;
        this.srcTokenUrl = `${this.blockchainUtil.network.blockExplorerUrls[0]}/token/${this.srcTokenAddress}`;
        this.dstTokenUrl = `${this.blockchainUtil.network.blockExplorerUrls[0]}/token/${this.dstTokenAddress}`;

        this.swaps = await this.getSwaps();
        this.srcAmountInBaseUnit = await this.blockchainUtil.toBaseUnit(this.srcAmount, this.srcTokenAddress);
        this.dstAmountInBaseUnit = await this.blockchainUtil.toBaseUnit(this.dstAmount, this.dstTokenAddress);
        this.feeAmountInBaseUnit = ethers.utils.formatUnits(this.feeAmount, 'ether');
        this.displayCreatedTime = new Date(this.createdTime * 1000).toLocaleString();
        this.displayExpirationTime = this.expirationTime.toString() !== '0' ? new Date(this.expirationTime * 1000).toLocaleString() : null;
        this.currentBlockTimestamp = await this.blockchainUtil.getCurrentBlockTimestamp();
        this.srcAccountTokenBalance = await this.blockchainUtil.getTokenBalance(this.srcAddress, this.srcTokenAddress);
        this.swapsDstAmountSum = this.getSwapsDstAmountSum();
        this.filledPercentage = this.swapsDstAmountSum.mul(100).div(swapOffer.dstAmount).toNumber();

        this.scalingFactor = ethers.BigNumber.from('10').pow(18);
        this.exchangeRate = this.srcAmount.mul(this.scalingFactor).div(this.dstAmount);
        this.displayExchangeRateSrcDst = this.srcAmountInBaseUnit / this.dstAmountInBaseUnit;

        this.remainingDstAmountSum = this.dstAmount.sub(this.swapsDstAmountSum);
        this.remainingSrcAmountSum = this.remainingDstAmountSum.eq(this.dstAmount) ? this.srcAmount : this.remainingDstAmountSum.mul(this.exchangeRate).div(this.scalingFactor);

        this.readableStatus = this.getSwapOfferStatus();
    }
}

export default SwapOffer;
