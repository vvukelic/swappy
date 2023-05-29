import { useState } from 'react';
import { getProvider } from '../utils/web3';
import { useAccount } from '../context/AccountContext';

export const useWalletConnect = () => {
    const { defaultAccount, setDefaultAccount, setWalletConnected } = useAccount();

    const connectWallet = async () => {
        try {
            const accounts = await getProvider().send('eth_requestAccounts', []);
            setDefaultAccount(accounts[0]);
            setWalletConnected(true);
        } catch (error) {
            console.error('Failed to connect wallet', error);
        }
    };

    return {
        defaultAccount,
        connectWallet,
    };
};
