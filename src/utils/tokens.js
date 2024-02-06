import commonTokens from '../data/commonTokens.json';


let tokensByAddressCache = {};
let tokensByNameCache = {};

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

const indexTokensByName = () => {
    if (Object.keys(tokensByNameCache).length) {
        return tokensByNameCache;
    }

    const tokenIndex = {};

    commonTokens.forEach((token) => {
        tokenIndex[token.name] = token;
    });

    tokensByNameCache = tokenIndex;

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

const addCustomToken = (customToken) => {
    let customTokensList = getCustomTokensList();

    customTokensList.push(customToken);
    saveCustomTokensList(customTokensList);

    tokensByAddressCache = {};
    tokensByNameCache = {};
}

const getAllTokens = () => {
    return [...commonTokens, ...getCustomTokensList()];
}

const updateCustomTokensList = () => {
    let customTokensList = getCustomTokensList();
    const networks = Object.keys(commonTokens[0].networkSpecificAddress);

    commonTokens.forEach((commonToken) => {
        networks.forEach((network) => {
            const commonTokenAddress = commonToken.networkSpecificAddress[network];

            // Filter out custom tokens that match the current commonToken's address on any network
            customTokensList = customTokensList.filter((customToken) => {
                const customTokenAddress = customToken.networkSpecificAddress[network];
                return customTokenAddress !== commonTokenAddress;
            });
        });
    });

    saveCustomTokensList(customTokensList);

    tokensByAddressCache = {};
    tokensByNameCache = {};
};


export { getTokenByAddress, getTokenByName, getTokenImageUrl, getAllTokens, addCustomToken, updateCustomTokensList };
