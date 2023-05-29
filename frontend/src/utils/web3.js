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
