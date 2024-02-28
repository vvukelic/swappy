import { ethers, BigNumber } from 'ethers';
import { getSwapOfferRaw, getSwapsForOffer, getCurrentBlockTimestamp, getTokenDecimals } from './web3';
import { getTokenByAddress, toBaseUnit, getTokenBalance } from './tokens';


export function sliceAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getSwapOfferFilledPercentage(swapOffer, swaps) {
    let swapsDstAmountSum = ethers.BigNumber.from('0');

    for (let i = 0; i < swaps.length; i++) {
        swapsDstAmountSum = swapsDstAmountSum.add(swaps[i].dstAmount);
    }

    return swapsDstAmountSum.mul(100).div(swapOffer.dstAmount).toNumber();
}

function getSwapOfferStatus(swapOffer, filledPercentage, srcAccountTokenBalance, currentBlockTimestamp) {
    if (swapOffer.status === 0) {
        if (filledPercentage === 100) {
            return 'FILLED';
        }

        if (!swapOffer.expirationTime.isZero() && swapOffer.expirationTime.lt(BigNumber.from(currentBlockTimestamp))) {
            return 'EXPIRED';
        } else if (srcAccountTokenBalance.lt(swapOffer.srcAmount)) {
            return 'ERROR';
        } else {
            return 'OPENED';
        }
    } else if (swapOffer.status === 1) {
        return 'CANCELED';
    }
}

export async function getSwapOffer(contractAddress, swapOfferHash, network) {
    try {
        const swapOffer = await getSwapOfferRaw(contractAddress, swapOfferHash);
        const swaps = await getSwapsForOffer(contractAddress, swapOfferHash);
        const filledPercentage = getSwapOfferFilledPercentage(swapOffer, swaps);
        const srcAmountInBaseUnit = await toBaseUnit(swapOffer.srcAmount, swapOffer.srcTokenAddress);
        const dstAmountInBaseUnit = await toBaseUnit(swapOffer.dstAmount, swapOffer.dstTokenAddress);
        const srcToken = getTokenByAddress(swapOffer.srcTokenAddress, network);
        const dstToken = getTokenByAddress(swapOffer.dstTokenAddress, network);
        const srcTokenDecimals = swapOffer.srcTokenAddress === ethers.constants.AddressZero ? 18 : await getTokenDecimals(swapOffer.srcTokenAddress);
        const dstTokenDecimals = swapOffer.srcTokenAddress === ethers.constants.AddressZero ? 18 : await getTokenDecimals(swapOffer.dstTokenAddress);
        const feeAmountInBaseUnit = ethers.utils.formatUnits(swapOffer.feeAmount, 'ether');
        const currentBlockTimestamp = await getCurrentBlockTimestamp();
        const srcAccountTokenBalance = await getTokenBalance(swapOffer.srcAddress, swapOffer.srcTokenAddress);

        return {
            ...swapOffer,
            srcAmountInBaseUnit: srcAmountInBaseUnit,
            dstAmountInBaseUnit: dstAmountInBaseUnit,
            feeAmountInBaseUnit: feeAmountInBaseUnit,
            srcToken: srcToken,
            dstToken: dstToken,
            srcTokenDecimals: srcTokenDecimals,
            dstTokenDecimals: dstTokenDecimals,
            srcTokenName: srcToken.name.toUpperCase(),
            dstTokenName: dstToken.name.toUpperCase(),
            displayCreatedTime: new Date(swapOffer.createdTime * 1000).toLocaleString(),
            displayExpirationTime: swapOffer.expirationTime.toString() !== '0' ? new Date(swapOffer.expirationTime * 1000).toLocaleString() : null,
            readableStatus: getSwapOfferStatus(swapOffer, filledPercentage, srcAccountTokenBalance, currentBlockTimestamp),
            filledPercentage: filledPercentage,
            exchangeRate: swapOffer.srcAmount / swapOffer.dstAmount,
        };
    } catch (error) {
        console.error(`Failed to get swap details for hash ${swapOfferHash}:`, error);
        return null;
    }
}
