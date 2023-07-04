import { ethers } from 'ethers';
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
