import { ethers, BigNumber } from 'ethers';
import { getSwapOfferRaw, getCurrentBlockTimestamp } from './web3';
import { getTokenByAddress, toBaseUnit, getTokenBalance } from './tokens';


export function sliceAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getSwapOfferStatus(swap, srcAccountTokenBalance, currentBlockTimestamp) {
    if (swap.status === 0) {
        if (!swap.expirationTime.isZero() && swap.expirationTime.lt(BigNumber.from(currentBlockTimestamp))) {
            return 'EXPIRED';
        } else if (srcAccountTokenBalance.lt(swap.srcAmount)) {
            return 'ERROR';
        } else {
            return 'OPENED';
        }
    } else if (swap.status === 1) {
        return 'SWAPPED';
    } else if (swap.status === 2) {
        return 'CANCELED';
    }
}

export async function getSwapOffer(contractAddress, swapOfferHash, network) {
    try {
        const swapOffer = await getSwapOfferRaw(contractAddress, swapOfferHash);
        const srcAmountInBaseUnit = await toBaseUnit(swapOffer.srcAmount, swapOffer.srcTokenAddress);
        const dstAmountInBaseUnit = await toBaseUnit(swapOffer.dstAmount, swapOffer.dstTokenAddress);
        const srcToken = getTokenByAddress(swapOffer.srcTokenAddress, network);
        const dstToken = getTokenByAddress(swapOffer.dstTokenAddress, network);
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
            srcTokenName: srcToken.name.toUpperCase(),
            dstTokenName: dstToken.name.toUpperCase(),
            displayCreatedTime: new Date(swapOffer.createdTime * 1000).toLocaleString(),
            displayExpirationTime: swapOffer.expirationTime.toString() !== '0' ? new Date(swapOffer.expirationTime * 1000).toLocaleString() : null,
            readableStatus: getSwapOfferStatus(swapOffer, srcAccountTokenBalance, currentBlockTimestamp),
        };
    } catch (error) {
        console.error(`Failed to get swap details for hash ${swapOfferHash}:`, error);
        return null;
    }
}
