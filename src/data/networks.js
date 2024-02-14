const networks = {
    ethereum: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        displayName: 'Ethereum',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        blockExplorerUrls: ['https://etherscan.io'],
    },
    goerli: {
        chainId: '0x5',
        chainName: 'Goerli Testnet',
        displayName: 'Goerli',
        nativeCurrency: {
            name: 'Goerli Ether',
            symbol: 'gETH',
            decimals: 18,
        },
        blockExplorerUrls: ['https://goerli.etherscan.io'],
    },
    polygon: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        displayName: 'Polygon',
        rpcUrls: ['https://polygon-rpc.com'],
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        blockExplorerUrls: ['https://polygonscan.com'],
    },
    bnbSmartChain: {
        chainId: '0x38',
        chainName: 'BNB Smart Chain Mainnet',
        displayName: 'BNB Smart Chain',
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
        blockExplorerUrls: ['https://bscscan.com'],
    },
};

export default networks;
