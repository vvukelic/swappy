import { ethers } from 'ethers';


const erc20Abi = require('../contracts/Erc20.json');
const swapManagerAbi = require('../contracts/Swap.json');

export function getProvider() {
    let provider;

    // Check if running in a browser environment with MetaMask or another web3 provider
    if (typeof window !== 'undefined' && window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
    }
    // Check if running in a Node.js environment
    else if (typeof process !== 'undefined' && process.versions.node) {
        const fallbackProviderUrl = 'https://mainnet.infura.io/v3/YOUR-API-KEY';
        provider = new ethers.providers.JsonRpcProvider(fallbackProviderUrl);
    }
    // Local
    else {
        const customProviderUrl = 'http://localhost:8545';
        provider = new ethers.providers.JsonRpcProvider(customProviderUrl);
    }

    return provider;
};

export async function getNetworkName() {
    const network = await getProvider().getNetwork();
    let networkName = '';

    switch (network.chainId) {
        case 1:
            networkName = 'mainnet';
            break;
        case 3:
            networkName = 'ropsten';
            break;
        case 4:
            networkName = 'rinkeby';
            break;
        case 5:
            networkName = 'goerli';
            break;
        case 42:
            networkName = 'kovan';
            break;
        case 137:
            networkName = 'polygon';
            break;
        case 80001:
            networkName = 'mumbai'; // polygon testnet
            break;
        default:
            networkName = 'localhost';
    }
    return networkName;
};

export async function getEthBalance(address) {
    if (!address) return null;

    try {
        let balance = await getProvider().getBalance(address);
        return balance
    } catch (error) {
        console.error('Error fetching ETH balance:', error);
        return null;
    }
}

export const getCurrentBlockTimestamp = async () => {
    const blockNumber = await getProvider().getBlockNumber();
    const block = await getProvider().getBlock(blockNumber);
    return block.timestamp;
}

export async function getAllowance(tokenContractAddress, ownerAddress, spenderAddress) {
    try {
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, getProvider());
        return await tokenContract.allowance(ownerAddress, spenderAddress);
    } catch (error) {
        console.error('Error checking allowance:', error);
    }
}

export async function getTokenDecimals(tokenContractAddress) {
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, getProvider());
    let decimals;

    try {
        decimals = await tokenContract.decimals();
    } catch (error) {
        console.error('Error getting token decimals:', error);
        throw error;
    }

    return decimals;
}

export async function approveToken(tokenContractAddress, spenderAddress) {
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, getProvider().getSigner());

    try {
        const tx = await tokenContract.approve(spenderAddress, ethers.constants.MaxUint256);
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error('Error approving token:', error);
        throw error;
    }
};

export async function createSwap(contractAddress, srcTokenAddress, srcAmount, dstTokenAddress, dstAmount, dstAddress, expiresIn) {
    const signer = getProvider().getSigner();
    const swapManagerContract = new ethers.Contract(contractAddress, swapManagerAbi, signer);
    let ethValue = 0;

    if (srcTokenAddress === ethers.constants.AddressZero) {
        ethValue = srcAmount;
    }

    try {
        const result = await swapManagerContract.createSwap(srcTokenAddress, srcAmount, dstTokenAddress, dstAmount, dstAddress, expiresIn, { value: ethValue });
        const receipt = await result.wait();
        return receipt;
    } catch (error) {
        console.error('Error creating swap', error);
        throw error;
    }
}

export async function getSwapRaw(contractAddress, swapHash) {
    const swapManagerContract = new ethers.Contract(contractAddress, swapManagerAbi, getProvider());
    const swap = await swapManagerContract.getSwap(swapHash);
    return swap;
}

export async function getUserSwaps(contractAddress, userAddress) {
    try {
        const contract = new ethers.Contract(contractAddress, swapManagerAbi, getProvider());
        const swapHashes = await contract.getUserSwaps(userAddress);
        return swapHashes;
    } catch (error) {
        console.error('Error fetching user swaps:', error);
        return [];
    }
};

export async function getDstUserSwaps(contractAddress, userAddress){
    try {
        const contract = new ethers.Contract(contractAddress, swapManagerAbi, getProvider());
        const swapHashes = await contract.getDstUserSwaps(userAddress);
        return swapHashes;
    } catch (error) {
        console.error('Error fetching destination user swaps:', error);
        return [];
    }
};

export async function takeSwap(contractAddress, swapHash, dstTokenAddress, dstAmount, feeAmount) {
    try {
        const signer = getProvider().getSigner();
        const swapManagerContract = new ethers.Contract(contractAddress, swapManagerAbi, signer);
        let nativeTokenAmount = 0;

        if (dstTokenAddress === ethers.constants.AddressZero) {
            nativeTokenAmount = ethers.utils.parseUnits(dstAmount, 'ether');
        }

        const transaction = await swapManagerContract.takeSwap(swapHash, { value: feeAmount.add(nativeTokenAmount) });
        const receipt = await transaction.wait();

        return receipt;
    } catch (error) {
        console.error('Error taking the swap:', error);
        throw error;
    }
}

export async function cancelSwap(contractAddress, swapHash) {
    try {
        const signer = getProvider().getSigner();
        const swapManagerContract = new ethers.Contract(contractAddress, swapManagerAbi, signer);
        const transaction = await swapManagerContract.cancelSwap(swapHash);
        const receipt = await transaction.wait();

        return receipt;
    } catch (error) {
        console.error('Error canceling the swap:', error);
        throw error;
    }
}

