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
        const balance = await provider.send('eth_getBalance', [account, 'latest']);
        const ethBalance = provider.utils.fromWei(balance, 'ether');
        return parseFloat(ethBalance).toFixed(2);
    } catch (error) {
        console.error('Error fetching ETH balance:', error);
        return null;
    }
};
