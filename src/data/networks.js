const networks = {
    ethereum: {
        chainId: 0x1,
        chainName: 'Ethereum Mainnet',
        uniqueName: 'ethereum',
        rpcUrls: ['https://eth.llamarpc.com'],
        color: '#3d5dd7',
        logo: '/images/eth-logo.png',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        wrappedNativeCurrencyAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        blockExplorerUrls: ['https://etherscan.io'],
    },
    polygon: {
        chainId: 0x89,
        chainName: 'Polygon Mainnet',
        uniqueName: 'polygon',
        rpcUrls: ['https://polygon-rpc.com'],
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        wrappedNativeCurrencyAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        color: '#6a22e4',
        logo: '/images/matic-logo.png',
        blockExplorerUrls: ['https://polygonscan.com'],
    },
    amoy: {
        chainId: 0x13882,
        chainName: 'Polygon Testnet',
        uniqueName: 'amoy',
        rpcUrls: ['https://rpc-amoy.polygon.technology/'],
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        wrappedNativeCurrencyAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        color: '#6a22e4',
        logo: '/images/matic-logo.png',
        blockExplorerUrls: ['https://polygonscan.com'],
    },
    bsc: {
        chainId: 0x38,
        chainName: 'BNB Smart Chain Mainnet',
        uniqueName: 'bsc',
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        color: '#b98b05',
        logo: '/images/bnb-logo.png',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
        wrappedNativeCurrencyAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        blockExplorerUrls: ['https://bscscan.com'],
    },
    bscTestnet: {
        chainId: 0x61,
        chainName: 'BNB Smart Chain Testnet',
        uniqueName: 'bscTestnet',
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
        color: '#b98b05',
        logo: '/images/bnb-logo.png',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
        wrappedNativeCurrencyAddress: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
        blockExplorerUrls: ['https://testnet.bscscan.com'],
    },
    goerli: {
        chainId: 0x5,
        chainName: 'Goerli Testnet',
        uniqueName: 'goerli',
        nativeCurrency: {
            name: 'Goerli Ether',
            symbol: 'gETH',
            decimals: 18,
        },
        wrappedNativeCurrencyAddress: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
        color: '#3d5dd7',
        logo: '/images/eth-logo.png',
        blockExplorerUrls: ['https://goerli.etherscan.io'],
    },
    sepolia: {
        chainId: 0xaa36a7,
        chainName: 'Ethereum Sepolia',
        uniqueName: 'sepolia',
        rpcUrls: ['https://sepolia.gateway.tenderly.co'],
        nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'SepoliaETH',
            decimals: 18,
        },
        wrappedNativeCurrencyAddress: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
        color: '#3d5dd7',
        logo: '/images/eth-logo.png',
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
    localhost: {
        chainId: 0x7a69,
        chainName: 'localhost',
        uniqueName: 'localhost',
        rpcUrls: ['http://localhost:8545'],
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        wrappedNativeCurrencyAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        color: '#3d5dd7',
        logo: '/images/eth-logo.png',
    },
};

export default networks;
