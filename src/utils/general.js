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

const supportedNetworkNames = ['localhost', 'sepolia'];
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
