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
        sepolia: {
            url: secret['sepolia_url'],
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
    },
};
