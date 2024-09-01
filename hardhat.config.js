require("@nomicfoundation/hardhat-toolbox");

const secret = require('./secret.json');

module.exports = {
    solidity: '0.8.9',
    networks: {
        hardhat: {
            forking: {
                url: secret['ethereum_url'],
                blockNumber: 19675398,
                // url: secret['polygon_url'],
                // blockNumber: 55099794
            },
        },
        ethereum: {
            url: secret['ethereum_url'],
            accounts: {
                mnemonic: secret['wallet_mnemonic'],
            },
        },
        sepolia: {
            url: secret['sepolia_url'],
            accounts: {
                mnemonic: secret['wallet_mnemonic'],
            },
        },
        optimism: {
            url: secret['optimism_url'],
            accounts: {
                mnemonic: secret['wallet_mnemonic'],
            },
        },
        polygon: {
            url: secret['polygon_url'],
            accounts: {
                mnemonic: secret['wallet_mnemonic'],
            },
        },
        bsc: {
            url: secret['bsc_url'],
            accounts: {
                mnemonic: secret['wallet_mnemonic'],
            },
        },
    },
    gasReporter: {
        enabled: true,
        L1: 'ethereum',
        currency: 'USD',
        noColors: true,
        outputFile: 'gasReportEther.txt',
        coinmarketcap: secret['coinmarketcap_api_key'],
        token: 'ETH',
    },
    etherscan: {
        apiKey: secret['optimistic_etherscan_api_key'],
    },
};
