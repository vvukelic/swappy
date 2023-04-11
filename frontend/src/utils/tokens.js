import ethMainnetTokens from '../data/ethMainnetTokens.json';

const indexTokensByAddress = () => {
    const tokenIndex = {};
    ethMainnetTokens.forEach((token) => {
        tokenIndex[token.address] = token;
    });
    return tokenIndex;
};

const indexTokensByName = () => {
    const tokenIndex = {};
    ethMainnetTokens.forEach((token) => {
        tokenIndex[token.name] = token;
    });
    return tokenIndex;
};

const getTokenByAddress = (address) => {
    const tokensByAddress = indexTokensByAddress();
    return tokensByAddress[address] || null;
};

const getTokenByName = (name) => {
    const tokensByName = indexTokensByName();
    return tokensByName[name] || null;
};

const getCoinImageUrl = (coin) => {
    if (coin && coin.logo) {
        return coin.logo;
    } else if (coin && coin.address) {
        return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${coin.address}/logo.png`;
    }
    return '';
};

export { getTokenByAddress, getTokenByName, getCoinImageUrl };
