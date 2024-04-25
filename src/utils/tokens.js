import { ethers } from 'ethers';

import commonTokens from '../data/commonTokens.json';

let tokensByAddressCache = {};

const indexTokensByAddress = (network) => {
    if (tokensByAddressCache[network]) {
        return tokensByAddressCache[network];
    }

    const tokenIndex = {};

    getAllTokens().forEach((token) => {
        tokenIndex[token.networkSpecificAddress[network]] = token;
    });

    tokensByAddressCache[network] = tokenIndex;

    return tokenIndex;
};

export function getTokenByAddress(address, network) {
    const tokensByAddress = indexTokensByAddress(network);
    return tokensByAddress[address] || null;
};

export function getNativeToken(network) {
    const tokensByAddress = indexTokensByAddress(network);
    return tokensByAddress[ethers.constants.AddressZero] || null;
}

export function getTokenImageUrl(token) {
    if (token && token.logo) {
        return token.logo;
    } else if (token && token.networkSpecificAddress['ethereum']) {
        return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${token.networkSpecificAddress['ethereum']}/logo.png`;
    }
    return '';
};

const saveCustomTokensList = (list) => {
    try {
        const serializedList = JSON.stringify(list);
        localStorage.setItem('customTokens', serializedList);
    } catch (error) {
        console.error('Error saving custom tokens to local storage', error);
    }
};

const getCustomTokensList = () => {
    try {
        const serializedList = localStorage.getItem('customTokens');

        if (!serializedList) {
            return [];
        }

        return JSON.parse(serializedList);
    } catch (error) {
        console.error('Error retrieving from local storage', error);
        return [];
    }
};

export function addCustomToken(customToken) {
    let customTokensList = getCustomTokensList();

    customTokensList.push(customToken);
    saveCustomTokensList(customTokensList);

    tokensByAddressCache = {};
};

export function getAllTokens() {
    return [...commonTokens, ...getCustomTokensList()];
};

export function updateCustomTokensList() {
    let customTokensList = getCustomTokensList();
    const networks = Object.keys(commonTokens[0].networkSpecificAddress);

    commonTokens.forEach((commonToken) => {
        networks.forEach((network) => {
            const commonTokenAddress = commonToken.networkSpecificAddress[network];

            if (!commonTokenAddress) {
                return;
            }

            // Filter out custom tokens that match the current commonToken's address on any network
            customTokensList = customTokensList.filter((customToken) => {
                const customTokenAddress = customToken.networkSpecificAddress[network];
                return customTokenAddress !== commonTokenAddress;
            });
        });
    });

    saveCustomTokensList(customTokensList);

    tokensByAddressCache = {};
};
