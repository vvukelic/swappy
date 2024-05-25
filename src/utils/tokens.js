import { ethers } from 'ethers';

import commonTokens from '../data/commonTokens.json';
import ethereumTokens from '../data/tokens/ethereum.json';
import polygonTokens from '../data/tokens/polygon.json';
import bscTokens from '../data/tokens/bsc.json';
import sepoliaTokens from '../data/tokens/sepolia.json';

let tokensByAddressCache = {};

const indexTokensByAddress = (network) => {
    if (tokensByAddressCache[network]) {
        return tokensByAddressCache[network];
    }

    const tokenIndex = {};

    getAllTokens(network).forEach((token) => {
        tokenIndex[token.address] = token;
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

const getCustomTokensList = (networkName) => {
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

// export function getAllTokens() {
//     return [...commonTokens, ...getCustomTokensList()];
// };

export function getAllTokens(networkName) {
    if (networkName === 'ethereum') {
        return [...getCustomTokensList(networkName), ...ethereumTokens.tokens];
    } else if (networkName === 'polygon') {
        return polygonTokens.tokens;
    } else if (networkName === 'bsc') {
        return [...getCustomTokensList(networkName), ...bscTokens.tokens];
    } else if (networkName === 'localhost') {
        return ethereumTokens.tokens;
    } else if (networkName === 'sepolia') {
        return sepoliaTokens.tokens;
    }
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

export function toSmallestUnit(amount, token) {
    return ethers.utils.parseUnits(amount, token.decimals);
}

export function toBaseUnit(amount, token) {
    return ethers.utils.formatUnits(amount, token.decimals);
}
