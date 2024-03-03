import { ethers } from 'ethers';
import networks from '../data/networks';


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
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    let networkName = 'Unsupported Network';

    Object.keys(networks).forEach((key) => {
        if (networks[key].chainId === ethers.utils.hexValue(network.chainId)) {
            networkName = networks[key].displayName;
        }
    });

    return networkName;
}

export async function switchNetwork(networkKey) {
    const network = networks[networkKey];

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: network.chainId }],
        });
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: network.chainId,
                            chainName: network.chainName,
                            rpcUrls: network.rpcUrls,
                            nativeCurrency: network.nativeCurrency,
                            blockExplorerUrls: network.blockExplorerUrls,
                        },
                    ],
                });
            } catch (addError) {
                console.error(addError);
            }
        }
    }
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

export async function getErc20TokenBalance(tokenContractAddress, accountAddress) {
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, getProvider());

    try {
        const balance = await tokenContract.balanceOf(accountAddress);
        return balance;
    } catch (error) {
        console.error('Error getting ERC20 token balance:', error);
        throw error;
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

export async function getTokenName(tokenContractAddress) {
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, getProvider());
    let name;

    try {
        name = await tokenContract.name();
    } catch (error) {
        console.error('Error getting token name:', error);
        throw error;
    }

    return name;
}

export async function getTokenSymbol(tokenContractAddress) {
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, getProvider());
    let symbol;

    try {
        symbol = await tokenContract.symbol();
    } catch (error) {
        console.error('Error getting token symbol:', error);
        throw error;
    }

    return symbol;
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

export async function createSwapOffer(contractAddress, srcTokenAddress, srcAmount, dstTokenAddress, dstAmount, dstAddress, expiresIn, partialFillEnabled) {
    const signer = getProvider().getSigner();
    const swapManagerContract = new ethers.Contract(contractAddress, swapManagerAbi, signer);
    let ethValue = 0;

    if (srcTokenAddress === ethers.constants.AddressZero) {
        ethValue = srcAmount;
    }

    try {
        const result = await swapManagerContract.createSwapOffer(srcTokenAddress, srcAmount, dstTokenAddress, dstAmount, dstAddress, expiresIn, partialFillEnabled, { value: ethValue });
        const receipt = await result.wait();
        return receipt;
    } catch (error) {
        console.error('Error creating swap', error);
        throw error;
    }
}

export async function getSwapOfferRaw(contractAddress, swapOfferHash) {
    const swapManagerContract = new ethers.Contract(contractAddress, swapManagerAbi, getProvider());
    const swapOffer = await swapManagerContract.getSwapOffer(swapOfferHash);
    return swapOffer;
}

export async function getSwapsForOffer(contractAddress, swapOfferHash) {
    const swapManagerContract = new ethers.Contract(contractAddress, swapManagerAbi, getProvider());
    const swapsForOffer = await swapManagerContract.getSwapsForOffer(swapOfferHash);
    return swapsForOffer;
}

export async function getUserSwapOffers(contractAddress, userAddress) {
    try {
        const contract = new ethers.Contract(contractAddress, swapManagerAbi, getProvider());
        const swapOffersHashes = await contract.getUserSwapOffers(userAddress);
        return swapOffersHashes;
    } catch (error) {
        console.error('Error fetching user swaps:', error);
        return [];
    }
};

export async function getSwapOffersForUser(contractAddress, userAddress){
    try {
        const contract = new ethers.Contract(contractAddress, swapManagerAbi, getProvider());
        const swapOffersHashes = await contract.getSwapOffersForUser(userAddress);
        return swapOffersHashes;
    } catch (error) {
        console.error('Error fetching destination user swaps:', error);
        return [];
    }
};

export async function createSwapForOffer(contractAddress, swapHash, dstTokenAddress, dstAmount, feeAmount) {
    try {
        const signer = getProvider().getSigner();
        const swapManagerContract = new ethers.Contract(contractAddress, swapManagerAbi, signer);
        let nativeTokenAmount = 0;

        if (dstTokenAddress === ethers.constants.AddressZero) {
            nativeTokenAmount = dstAmount;
        }

        const transaction = await swapManagerContract.createSwapForOffer(swapHash, dstAmount, { value: feeAmount.add(nativeTokenAmount) });
        const receipt = await transaction.wait();

        return receipt;
    } catch (error) {
        console.error('Error taking the swap:', error);
        throw error;
    }
}

export async function cancelSwapOffer(contractAddress, swapHash) {
    try {
        const signer = getProvider().getSigner();
        const swapManagerContract = new ethers.Contract(contractAddress, swapManagerAbi, signer);
        const transaction = await swapManagerContract.cancelSwapOffer(swapHash);
        const receipt = await transaction.wait();

        return receipt;
    } catch (error) {
        console.error('Error canceling the swap:', error);
        throw error;
    }
}

