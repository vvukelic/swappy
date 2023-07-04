import { useState, useEffect } from 'react';
import { getProvider, getNetworkName } from '../utils/web3';
import { useAccount } from '../context/AccountContext';

export const useWalletConnect = () => {
    const { defaultAccount, setDefaultAccount, network, setNetwork } = useAccount();
    const provider = getProvider();

    useEffect(() => {
        const handleAccountsChanged = async (accounts) => {
            const signer = provider.getSigner();
            setDefaultAccount(await signer.getAddress());
        };

        const handleChainChanged = async (chainId) => {
            setNetwork(await getNetworkName());
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
            setDefaultAccount(await signer.getAddress());
            setNetwork(await getNetworkName());
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
