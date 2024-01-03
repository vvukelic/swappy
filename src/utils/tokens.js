import tokenInfo from '../data/tokenInfo.json';

const indexTokensByAddress = (network) => {
    const tokenIndex = {};
    tokenInfo.forEach((token) => {
        tokenIndex[token.networkSpecificAddress[network]] = token;
    });
    return tokenIndex;
};

const indexTokensByName = () => {
    const tokenIndex = {};
    tokenInfo.forEach((token) => {
        tokenIndex[token.name] = token;
    });
    return tokenIndex;
};

const getTokenByAddress = (address, network) => {
    const tokensByAddress = indexTokensByAddress(network);
    return tokensByAddress[address] || null;
};

const getTokenByName = (name) => {
    const tokensByName = indexTokensByName();
    return tokensByName[name] || null;
};

const getTokenImageUrl = (token) => {
    if (token && token.logo) {
        return token.logo;
    } else if (token && token.networkSpecificAddress['mainnet']) {
        return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${token.networkSpecificAddress['mainnet']}/logo.png`;
    }
    return '';
};

export { getTokenByAddress, getTokenByName, getTokenImageUrl };
