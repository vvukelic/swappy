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
