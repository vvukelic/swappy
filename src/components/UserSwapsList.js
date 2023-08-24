import React, { useEffect, useState } from 'react';
import { getUserSwaps, getDstUserSwaps, getSwap } from '../utils/web3';
import { getTokenByAddress } from '../utils/tokens';

const contractAddresses = require('../contracts/contract-address.json');

const UserSwapsList = ({ userAddress, network }) => {
    const [userSwaps, setUserSwaps] = useState([]);
    const [destinationSwaps, setDestinationSwaps] = useState([]);

    useEffect(() => {
        const fetchUserSwaps = async () => {
            const swapHashes = await getUserSwaps(contractAddresses.SwapManager[network], userAddress);
            const swapsWithHash = await Promise.all(
                swapHashes.map(async (hash) => {
                    const swapDetails = await getSwap(contractAddresses.SwapManager[network], hash);
                    return { hash, details: swapDetails };
                })
            );
            setUserSwaps(swapsWithHash);
        };

        const fetchDestinationSwaps = async () => {
            const swapHashes = await getDstUserSwaps(contractAddresses.SwapManager[network], userAddress);
            const swapsWithHash = await Promise.all(
                swapHashes.map(async (hash) => {
                    const swapDetails = await getSwap(contractAddresses.SwapManager[network], hash);
                    return { hash, details: swapDetails };
                })
            );
            setDestinationSwaps(swapsWithHash);
        };

        fetchUserSwaps();
        fetchDestinationSwaps();
    }, [userAddress, network]);

    const renderSwaps = (swaps) => (
        <ul>
            {swaps.map((swap, index) => (
                <li key={index}>
                    <a href={`/swap/${swap.hash}`} target='_blank' rel='noopener noreferrer'>
                        {getTokenByAddress(swap.details.srcTokenAddress).name}: {swap.details.srcAmount.toString()} → {getTokenByAddress(swap.details.dstTokenAddress).name}: {swap.details.dstAmount.toString()}
                        <br />
                        Status: {swap.details.status === 0 ? 'OPEN' : swap.details.status === 1 ? 'CLOSED' : 'CANCELED'}
                    </a>
                </li>
            ))}
        </ul>
    );

    return (
        <div>
            <h3>Your swaps</h3>
            {renderSwaps(userSwaps)}
            <h3>Swaps from other users</h3>
            {renderSwaps(destinationSwaps)}
        </div>
    );
};

export default UserSwapsList;
