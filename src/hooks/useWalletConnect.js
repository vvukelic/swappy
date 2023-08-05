import { useState, useEffect } from 'react';
import { getProvider, getNetworkName } from '../utils/web3';
import { useAccount } from '../context/AccountContext';

export const useWalletConnect = () => {
    const { defaultAccount, setDefaultAccount, network, setNetwork } = useAccount();
    const provider = getProvider();

    useEffect(() => {
        const savedAccount = localStorage.getItem('defaultAccount');
        const savedNetwork = localStorage.getItem('network');

        if (savedAccount && savedNetwork) {
            setDefaultAccount(savedAccount);
            setNetwork(savedNetwork);
        }
    }, []);

    useEffect(() => {
        const handleAccountsChanged = async (accounts) => {
            const signer = provider.getSigner();
            const account = await signer.getAddress();

            setDefaultAccount(account);
            localStorage.setItem('defaultAccount', account);
        };

        const handleChainChanged = async (chainId) => {
            const networkName = await getNetworkName();

            setNetwork(networkName);
            localStorage.setItem('network', networkName);
        };

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.off('accountsChanged', handleAccountsChanged);
                window.ethereum.off('chainChanged', handleChainChanged);
            }
        };
    }, []);

    const connectWallet = async () => {
        try {
            const signer = provider.getSigner();
            const accounts = await provider.send('eth_requestAccounts');
            const account = await signer.getAddress();
            setDefaultAccount(account);
            const networkName = await getNetworkName();
            setNetwork(networkName);

            localStorage.setItem('defaultAccount', account);
            localStorage.setItem('network', networkName);
        } catch (error) {
            console.error('Failed to connect wallet', error);
        }
    };

    return {
        defaultAccount,
        connectWallet,
        network,
    };
};
