const networks = {
    ethereum: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        displayName: 'ethereum',
        color: '#3d5dd7',
        logo: '/images/eth-logo.png',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        blockExplorerUrls: ['https://etherscan.io'],
    },
    polygon: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        displayName: 'polygon',
        rpcUrls: ['https://polygon-rpc.com'],
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        color: '#6a22e4',
        logo: '/images/matic-logo.png',
        blockExplorerUrls: ['https://polygonscan.com'],
    },
    bnbSmartChain: {
        chainId: '0x38',
        chainName: 'BNB Smart Chain Mainnet',
        displayName: 'bnb smart chain',
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        color: '#f1bb1e',
        logo: '/images/bnb-logo.png',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
        blockExplorerUrls: ['https://bscscan.com'],
    },
    goerli: {
        chainId: '0x5',
        chainName: 'Goerli Testnet',
        displayName: 'goerli',
        nativeCurrency: {
            name: 'Goerli Ether',
            symbol: 'gETH',
            decimals: 18,
        },
        color: '#627EEA',
        logo: '/images/eth-logo.png',
        blockExplorerUrls: ['https://goerli.etherscan.io'],
    },
};

export default networks;
