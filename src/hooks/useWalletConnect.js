import { useState, useEffect } from 'react';
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers5/react';
import { ethers } from 'ethers';
import { BlockchainUtil } from '../utils/blockchainUtil';
import networks from '../data/networks';


export const useWalletConnect = () => {
    const { address, chainId, isConnected } = useWeb3ModalAccount();
    const { walletProvider } = useWeb3ModalProvider();
    const [blockchainUtil, setBlockchainUtil] = useState(null);
    const [network, setNetwork] = useState(null);
    const [isAccountConnected, setIsAccountConnected] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && network && walletProvider) {
            setBlockchainUtil(new BlockchainUtil(network, new ethers.providers.Web3Provider(walletProvider)));
        }
    }, [network, walletProvider]);

    useEffect(() => {
        setNetwork(networks[chainId]);
    }, [chainId]);

    useEffect(() => {
        setIsAccountConnected(isConnected);
    }, [isConnected]);

    return {
        defaultAccount: address,
        network,
        blockchainUtil,
        isAccountConnected,
    };
};
