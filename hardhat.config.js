require("@nomicfoundation/hardhat-toolbox");

const secret = require('./secret.json');

module.exports = {
  solidity: "0.8.9",
  networks: {
    goerli: {
      url: secret['network_url'],
      accounts: {
        mnemonic: secret['wallet_mnemonic']
      }
    }
  }
};
