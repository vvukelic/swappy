require("@nomicfoundation/hardhat-toolbox");

const secret = require('./secret.json');

module.exports = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      forking: {
        url: secret['mainnet_url'],
        blockNumber: 16753978
      }
    },
    goerli: {
      url: secret['goerli_url'],
      accounts: {
        mnemonic: secret['wallet_mnemonic']
      }
    }
  }
};
