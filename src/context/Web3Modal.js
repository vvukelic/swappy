import React from 'react';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react';
import networks from '../data/networks';

const secret = require('../../secret.json');

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = secret['wallet_connect'];

// 2. Set chains
// const sepolia = {
//     chainId: 0xaa36a7,
//     name: 'Sepolia',
//     currency: 'SepoliaETH',
//     explorerUrl: 'https://sepolia.etherscan.io',
//     rpcUrl: 'https://rpc.sepolia.org',
// };

// const localhost = {
//     chainId: 0x7a69,
//     name: 'localhost',
//     currency: 'ETH',
//     explorerUrl: '',
//     rpcUrl: 'http://localhost:8545',
// };
function extractNetworkInfo(networks) {
    return Object.keys(networks).map((key) => {
        const network = networks[key];
        return {
            chainId: network.chainId,
            name: network.chainName,
            currency: network.nativeCurrency.name,
            explorerUrl: network.blockExplorerUrls ? network.blockExplorerUrls[0] : '',
            rpcUrl: network.rpcUrls ? network.rpcUrls[0] : '',
        };
    });
}

const networkList = extractNetworkInfo(networks);

// 3. Create a metadata object
const metadata = {
    name: 'Swappy',
    description: 'Swappy is a platform facilitating decentralized, peer-to-peer (P2P) swaps, offering users a trustless environment for over-the-counter (OTC)trading.',
    url: 'https://swappy-fi.com', // origin must match your domain & subdomain
    icons: [],
};

// 4. Create Ethers config
const ethersConfig = defaultConfig({
    // Required
    metadata,

    // Optional
    enableEIP6963: true, // true by default
    enableInjected: true, // true by default
    enableCoinbase: true, // true by default
});

// 5. Create a Web3Modal instance
const web3Modal = createWeb3Modal({
    ethersConfig,
    chains: networkList,
    projectId,
    enableAnalytics: true, // Optional - defaults to your Cloud configuration
    enableOnramp: false, // Optional - false as default
});

export function Web3Modal({ children }) {
    // React.useEffect or any additional logic can be added here if needed

    return <>{children}</>;
}
