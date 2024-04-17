import { useState, useEffect } from 'react';
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers5/react';
import { ethers } from 'ethers';
import { BlockchainUtil } from '../utils/blockchainUtil';
import networks from '../data/networks';
import { getSupportedNetworks } from '../utils/general';


export const useWalletConnect = () => {
    const { address, chainId, isConnected } = useWeb3ModalAccount();
    const { walletProvider } = useWeb3ModalProvider();
    const [blockchainUtil, setBlockchainUtil] = useState(null);
    const [network, setNetwork] = useState(null);
    const [isAccountConnected, setIsAccountConnected] = useState(null);

    useEffect(() => {
        const supportedNetworks = getSupportedNetworks();

        if (typeof window !== 'undefined' && network && walletProvider && supportedNetworks.includes(network)) {
            const provider = new ethers.providers.Web3Provider(walletProvider, 'any');

            // This is mentioned in best practices, but removed for now because of better UX
            // provider.on('network', (newNetwork, oldNetwork) => {
            //     // When a Provider makes its initial connection, it emits a "network"
            //     // event with a null oldNetwork along with the newNetwork. So, if the
            //     // oldNetwork exists, it represents a changing network
            //     if (oldNetwork) {
            //         window.location.reload();
            //     }
            // });

            setBlockchainUtil(new BlockchainUtil(network, provider));
        }
    }, [network, walletProvider]);

    useEffect(() => {
        Object.values(networks).forEach(network => {
            if (network.chainId === chainId) {
                setNetwork(network);
                return;
            }
        });
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
