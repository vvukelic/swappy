import { ethers, BigNumber } from 'ethers';
import { getTokenDecimals, getSwapRaw, getCurrentBlockTimestamp } from './web3';
import { getTokenByAddress } from './tokens';


export async function toSmallestUnit(amount, tokenContractAddress) {
    let decimals = null;

    if (tokenContractAddress === ethers.constants.AddressZero) {
        decimals = 18;
    } else {
        decimals = await getTokenDecimals(tokenContractAddress);
    }

    return ethers.utils.parseUnits(amount, decimals);
}

export async function toBaseUnit(amount, tokenContractAddress) {
    let decimals = null;

    if (tokenContractAddress === ethers.constants.AddressZero) {
        decimals = 18;
    } else {
        decimals = await getTokenDecimals(tokenContractAddress);
    }

    return ethers.utils.formatUnits(amount, decimals);
}

export function sliceAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getSwapStatus(swap, currentBlockTimestamp) {
    if (swap.status === 0) {
        return !swap.expirationTime.isZero() && swap.expirationTime.lt(BigNumber.from(currentBlockTimestamp)) ? 'EXPIRED' : 'OPENED';
    } else if (swap.status === 1) {
        return 'COMPLETED';
    } else if (swap.status === 2) {
        return 'CANCELED';
    }
}

export async function getSwap(contractAddress, swapHash, network) {
    try {
        const swap = await getSwapRaw(contractAddress, swapHash);
        const srcAmountInBaseUnit = await toBaseUnit(swap.srcAmount, swap.srcTokenAddress);
        const dstAmountInBaseUnit = await toBaseUnit(swap.dstAmount, swap.dstTokenAddress);
        const srcToken = getTokenByAddress(swap.srcTokenAddress, network);
        const dstToken = getTokenByAddress(swap.dstTokenAddress, network);
        const feeAmountInBaseUnit = ethers.utils.formatUnits(swap.feeAmount, 'ether');
        const currentBlockTimestamp = await getCurrentBlockTimestamp();

        return {
            ...swap,
            srcAmountInBaseUnit: srcAmountInBaseUnit,
            dstAmountInBaseUnit: dstAmountInBaseUnit,
            feeAmountInBaseUnit: feeAmountInBaseUnit,
            srcToken: srcToken,
            dstToken: dstToken,
            srcTokenName: srcToken.name.toUpperCase(),
            dstTokenName: dstToken.name.toUpperCase(),
            displayCreatedTime: new Date(swap.createdTime * 1000).toLocaleString(),
            displayExpirationTime: swap.expirationTime.toString() !== '0' ? new Date(swap.expirationTime * 1000).toLocaleString() : null,
            readableStatus: getSwapStatus(swap, currentBlockTimestamp),
        };
    } catch (error) {
        console.error(`Failed to get swap details for hash ${swapHash}:`, error);
        return null;
    }
}
