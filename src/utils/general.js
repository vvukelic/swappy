import { ethers, BigNumber } from 'ethers';
import { getTokenDecimals } from './web3';


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

export function getSwapStatus(swapDetails, currentBlockTimestamp) {
    if (swapDetails.status === 0) {
        console.debug(currentBlockTimestamp);
        return !swapDetails.expirationTime.isZero() && swapDetails.expirationTime.lt(BigNumber.from(currentBlockTimestamp)) ? 'EXPIRED' : 'OPENED';
    } else if (swapDetails.status === 1) {
        return 'COMPLETED';
    } else if (swapDetails.status === 2) {
        return 'CANCELED';
    }
}
