import { useState, useEffect } from 'react';
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers5/react';
import { ethers } from 'ethers';
// import { getProvider, getNetworkName } from '../utils/web3';
// import { useAccount } from '../context/AccountContext';
import { BlockchainUtil } from '../utils/blockchainUtil';
import networks from '../data/networks';


export const useWalletConnect = () => {
    // const { defaultAccount, setDefaultAccount, network, setNetwork } = useAccount();
    // const provider = getProvider();
    const { defaultAccount, chainId, isConnected } = useWeb3ModalAccount();
    const { walletProvider } = useWeb3ModalProvider();
    const [blockchainUtil, setBlockchainUtil] = useState(null);
    const [network, setNetwork] = useState(null);
    const [isAccountConnected, setIsAccountConnected] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && network && walletProvider) {
            setBlockchainUtil(new BlockchainUtil(network.uniqueName, new ethers.providers.Web3Provider(walletProvider)));
        }
    }, [network, walletProvider]);

    useEffect(() => {
        setNetwork(networks[chainId]);
    }, [chainId]);

    useEffect(() => {
        setIsAccountConnected(isConnected);
    }, [isConnected]);

    // useEffect(() => {
    //     const savedAccount = localStorage.getItem('defaultAccount');
    //     const savedNetwork = localStorage.getItem('network');

    //     if (savedAccount && savedNetwork) {
    //         setDefaultAccount(savedAccount);
    //         setNetwork(savedNetwork);
    //     }
    // }, []);

    // useEffect(() => {
    //     const handleAccountsChanged = async (accounts) => {
    //         const signer = provider.getSigner();
    //         const account = await signer.getAddress();

    //         setDefaultAccount(account);
    //         localStorage.setItem('defaultAccount', account);
    //     };

    //     const handleChainChanged = async (chainId) => {
    //         const networkName = await getNetworkName();

    //         setNetwork(networkName);
    //         localStorage.setItem('network', networkName);
    //     };

    //     if (window.ethereum) {
    //         window.ethereum.on('accountsChanged', handleAccountsChanged);
    //         window.ethereum.on('chainChanged', handleChainChanged);
    //     }

    //     return () => {
    //         if (window.ethereum && window.ethereum.removeListener) {
    //             window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    //             window.ethereum.removeListener('chainChanged', handleChainChanged);
    //         }
    //     };
    // }, []);


    // const connectWallet = async () => {
    //     try {
    //         const signer = provider.getSigner();
    //         await provider.send('eth_requestAccounts');
    //         const account = await signer.getAddress();
    //         setDefaultAccount(account);
    //         const networkName = await getNetworkName();
    //         setNetwork(networkName);

    //         localStorage.setItem('defaultAccount', account);
    //         localStorage.setItem('network', networkName);
    //     } catch (error) {
    //         console.error('Failed to connect wallet', error);
    //     }
    // };

    return {
        defaultAccount,
        network,
        blockchainUtil,
        isAccountConnected,
    };
};
