import networks from "../data/networks";


export function sliceAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function waitForTxToBeMined(tx) {
    try {
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error('Transaction error:', error);
        throw error;
    }
}

export const networkNames = {
    development: ['ethereum', 'optimism', 'polygon', 'bsc', 'localhost', 'sepolia'],
    production: ['ethereum', 'optimism', 'polygon', 'bsc'],
};

const environment = process.env.NODE_ENV || 'production';
export const supportedNetworkNames = networkNames[environment] || networkNames.production;
let supportedNetworks = [];

export function getSupportedNetworks() {
    if (supportedNetworks.length > 0) {
        return supportedNetworks;
    }

    supportedNetworkNames.forEach((name) => {
        const network = networks[name];

        if (network) {
            supportedNetworks.push(network);
        }
    });

    return supportedNetworks;
}
