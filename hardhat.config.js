require("@nomicfoundation/hardhat-toolbox");

const secret = require('./secret.json');

module.exports = {
    solidity: '0.8.9',
    networks: {
        hardhat: {
            forking: {
                url: secret['ethereum_url'],
                blockNumber: 16753978
                // url: secret['polygon_url'],
                // blockNumber: 55099794
            },
        },
        goerli: {
            url: secret['goerli_url'],
            accounts: {
                mnemonic: secret['wallet_mnemonic'],
            },
        },
    },
};
