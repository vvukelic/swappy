import React, { useEffect, useState } from 'react';
import { getSwap } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getTokenByAddress } from '../utils/tokens';

const contractAddresses = require('../contracts/contract-address.json');

function SwapDetails({ hash }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [swapDetails, setSwapDetails] = useState(null);

    useEffect(() => {
        async function getSwapDetails() {
            try {
                const swap = await getSwap(contractAddresses.SwapManager[network], hash);
                setSwapDetails(swap);
            } catch (err) {
                console.error(err);
            }
        }

        getSwapDetails();
    }, [hash, network]);

    if (!swapDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Swap Details</h2>
            <p>Swap hash: {hash}</p>
            <p>Source Token: {getTokenByAddress(swapDetails.srcTokenAddress).name}</p>
            <p>Source Amount: {swapDetails.srcAmount.toString()}</p>
            <p>Destination Token: {getTokenByAddress(swapDetails.dstTokenAddress).name}</p>
            <p>Destination Amount: {swapDetails.dstAmount.toString()}</p>
            {/* <p>Minimum Destination Amount: {swapDetails.minDstAmount.toString()}</p> */}
            <p>Status: {swapDetails.status === 0 ? 'OPEN' : swapDetails.status === 1 ? 'CLOSED' : 'CANCELED'}</p>
        </div>
    );
}

export default SwapDetails;
