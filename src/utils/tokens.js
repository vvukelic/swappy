import { ethers } from 'ethers';

import ethereumTokens from '../data/tokens/ethereum.json';
import optimismTokens from '../data/tokens/optimism.json';
import polygonTokens from '../data/tokens/polygon.json';
import bscTokens from '../data/tokens/bsc.json';
import sepoliaTokens from '../data/tokens/sepolia.json';
import localhostTokens from '../data/tokens/localhost.json';

let tokensByAddressCache = {};
let commonTokensByAddressCache = {};

const indexTokensByAddress = (networkName) => {
    if (tokensByAddressCache[networkName]) {
        return tokensByAddressCache[networkName];
    }

    const tokenIndex = {};

    getAllTokens(networkName).forEach((token) => {
        tokenIndex[token.address] = token;
    });

    tokensByAddressCache[networkName] = tokenIndex;

    return tokenIndex;
};

const indexCommonTokensByAddress = (networkName) => {
    if (commonTokensByAddressCache[networkName]) {
        return commonTokensByAddressCache[networkName];
    }

    const commonTokenIndex = {};

    getCommonTokensList(networkName).forEach((token) => {
        commonTokenIndex[token.address] = token;
    });

    commonTokensByAddressCache[networkName] = commonTokenIndex;

    return commonTokenIndex;
};

export function getTokenByAddress(address, networkName) {
    const tokensByAddress = indexTokensByAddress(networkName);
    return tokensByAddress[address] || null;
};

export function getCommonTokenByAddress(address, networkName) {
    const commonTokensByAddress = indexCommonTokensByAddress(networkName);
    return commonTokensByAddress[address] || null;
};

export function getNativeToken(network) {
    const tokensByAddress = indexTokensByAddress(network);
    return tokensByAddress[ethers.constants.AddressZero] || null;
}

export function getTokenImageUrl(token) {
    if (token && token.logoURI) {
        return token.logoURI;
    }

    return '/images/no-image-logo.svg';
};

const saveCustomTokensList = (list, networkName) => {
    try {
        const serializedList = JSON.stringify(list);
        localStorage.setItem(networkName + 'SwappyCustomTokens', serializedList);
    } catch (error) {
        console.error('Error saving custom tokens to local storage', error);
    }
};

function getCommonTokensList(networkName) {
    if (networkName === 'ethereum') {
        return ethereumTokens.tokens;
    } else if (networkName === 'optimism') {
        return optimismTokens.tokens;
    } else if (networkName === 'polygon') {
        return polygonTokens.tokens;
    } else if (networkName === 'bsc') {
        return bscTokens.tokens;
    } else if (networkName === 'localhost') {
        return localhostTokens.tokens;
    } else if (networkName === 'sepolia') {
        return sepoliaTokens.tokens;
    }
}

function getCustomTokensList(networkName) {
    try {
        const serializedList = localStorage.getItem(networkName + 'SwappyCustomTokens');

        if (!serializedList) {
            return [];
        }

        return JSON.parse(serializedList);
    } catch (error) {
        console.error('Error retrieving from local storage', error);
        return [];
    }
};

export function addCustomToken(customToken, networkName) {
    let customTokensList = getCustomTokensList(networkName);

    customTokensList.push(customToken);
    saveCustomTokensList(customTokensList, networkName);

    tokensByAddressCache = {};
};

export function getAllTokens(networkName) {
    return [...getCustomTokensList(networkName), ...getCommonTokensList(networkName)];
};

export function updateCustomTokensList(networkName) {
    const customTokensList = getCustomTokensList(networkName);

    const filteredCustomTokensList = customTokensList.filter((customToken) => {
        return !getCommonTokenByAddress(customToken.address, networkName);
    });

    saveCustomTokensList(filteredCustomTokensList, networkName);

    tokensByAddressCache = {};
    commonTokensByAddressCache = {};
};

export function toSmallestUnit(amount, token) {
    return ethers.utils.parseUnits(amount, token.decimals);
}

export function toBaseUnit(amount, token) {
    return ethers.utils.formatUnits(amount, token.decimals);
}
