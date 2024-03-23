import { ethers } from 'ethers';
import { getSwapOfferRaw, getSwapsForOffer, getTokenDecimals, getCurrentBlockTimestamp } from './web3';
import { toBaseUnit, getTokenByAddress, getTokenBalance } from './tokens';
import { sliceAddress } from './general';


const contractAddresses = require('../contracts/contract-address.json');

class SwapOffer {
    constructor(network) {
        this.contractAddress = contractAddresses.SwapManager[network];
        this.network = network;
    }

    getSwapOfferStatus() {
        if (this.status === 0) {
            if (this.filledPercentage === 100) {
                return 'FILLED';
            }

            if (!this.expirationTime.isZero() && this.expirationTime.lt(ethers.BigNumber.from(this.currentBlockTimestamp))) {
                return 'EXPIRED';
            } else if (this.srcAccountTokenBalance.lt(this.srcAmount)) {
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
        const rawSwaps = await getSwapsForOffer(this.contractAddress, this.hash);
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

    async load(swapOfferHash) {
        const swapOffer = await getSwapOfferRaw(this.contractAddress, swapOfferHash);
        this.hash = swapOfferHash;
        this.srcAddress = swapOffer.srcAddress;
        this.dstAddress = swapOffer.dstAddress;
        this.srcTokenAddress = swapOffer.srcTokenAddress;
        this.dstTokenAddress = swapOffer.dstTokenAddress;
        this.srcAmount = swapOffer.srcAmount;
        this.dstAmount = swapOffer.dstAmount;
        this.feeAmount = swapOffer.feeAmount;
        this.createdTime = swapOffer.createdTime;
        this.expirationTime = swapOffer.expirationTime;
        this.partialFillEnabled = swapOffer.partialFillEnabled;
        this.status = swapOffer.status;
        this.srcTokenDecimals = this.srcTokenAddress === ethers.constants.AddressZero ? 18 : await getTokenDecimals(this.srcTokenAddress);
        this.dstTokenDecimals = this.dstTokenAddress === ethers.constants.AddressZero ? 18 : await getTokenDecimals(this.dstTokenAddress);
        this.srcToken = await getTokenByAddress(this.srcTokenAddress, this.network);
        this.dstToken = await getTokenByAddress(this.dstTokenAddress, this.network);
        this.srcTokenName = this.srcToken.name.toUpperCase();
        this.dstTokenName = this.dstToken.name.toUpperCase();
        this.swaps = await this.getSwaps();
        this.srcAmountInBaseUnit = await toBaseUnit(this.srcAmount, this.srcTokenAddress);
        this.dstAmountInBaseUnit = await toBaseUnit(this.dstAmount, this.dstTokenAddress);
        this.feeAmountInBaseUnit = ethers.utils.formatUnits(this.feeAmount, 'ether');
        this.displayCreatedTime = new Date(this.createdTime * 1000).toLocaleString();
        this.displayExpirationTime = this.expirationTime.toString() !== '0' ? new Date(this.expirationTime * 1000).toLocaleString() : null;
        this.currentBlockTimestamp = await getCurrentBlockTimestamp();
        this.srcAccountTokenBalance = await getTokenBalance(this.srcAddress, this.srcTokenAddress);
        this.swapsDstAmountSum = this.getSwapsDstAmountSum();
        this.filledPercentage = this.swapsDstAmountSum.mul(100).div(swapOffer.dstAmount).toNumber();
        this.readableStatus = this.getSwapOfferStatus();

        this.scalingFactor = ethers.BigNumber.from('10').pow(18);
        this.exchangeRate = this.srcAmount.mul(this.scalingFactor).div(this.dstAmount);
        this.displayExchangeRateSrcDst = this.srcAmountInBaseUnit / this.dstAmountInBaseUnit;

        this.remainingDstAmountSum = this.dstAmount.sub(this.swapsDstAmountSum);
        this.remainingSrcAmountSum = this.remainingDstAmountSum.eq(this.dstAmount) ? this.srcAmount : this.remainingDstAmountSum.mul(this.exchangeRate).div(this.scalingFactor);
    }
}

export default SwapOffer;
