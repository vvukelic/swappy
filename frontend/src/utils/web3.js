import { ethers } from 'ethers';

export const getProvider = () => {
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

export const getNetworkName = async () => {
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

export const fetchEthBalance = async (account) => {
    if (!account) return null;

    try {
        let balance = await getProvider().getBalance(account);
        balance = ethers.utils.formatEther(balance);
        return parseFloat(balance).toFixed(2);
    } catch (error) {
        console.error('Error fetching ETH balance:', error);
        return null;
    }
};

export async function getAllowance(tokenContractAddress, ownerAddress, spenderAddress) {
    try {
        const erc20ABI = require('../contracts/Erc20.json');
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, getProvider());
        
        return await tokenContract.allowance(ownerAddress, spenderAddress);
    } catch (error) {
        console.error('Error checking allowance:', error);
    }
}


export const approveToken = async (tokenContractAddress, spenderAddress) => {
    const erc20ABI = require('../contracts/Erc20.json');
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, getProvider().getSigner());

    try {
        const tx = await tokenContract.approve(spenderAddress, ethers.constants.MaxUint256);
        const receipt = await tx.wait();

        return receipt.status === 1;
    } catch (error) {
        console.error('Error approving token:', error);
        return false;
    }
};


async function createSwap(contractAddress, srcTokenAddress, srcAmount, dstTokenAddress, dstAmount, expiration) {
    const signer = getProvider().getSigner();

    // instantiate the contract
    const swapManagerContract = new ethers.Contract(contractAddress, yourContractAbi, signer);

    // call the createSwap function
    const result = await swapManagerContract.createSwap(srcTokenAddress, srcAmount, dstTokenAddress, dstAmount, expiration);

    // wait for the transaction to be mined
    const receipt = await result.wait();

    return receipt;
}

