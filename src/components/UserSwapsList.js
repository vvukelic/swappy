import React, { useEffect, useState } from 'react';
import { getUserSwaps, getSwap } from '../utils/web3';
import { getTokenByAddress } from '../utils/tokens';

const contractAddresses = require('../contracts/contract-address.json');

const UserSwapsList = ({ userAddress, network }) => {
    const [userSwaps, setUserSwaps] = useState([]);

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

        fetchUserSwaps();
    }, [userAddress, network]);

    return (
        <div>
            <h3>Your Swaps</h3>
            <ul>
                {userSwaps.map((swap, index) => (
                    <li key={index}>
                        <a href={`/swap/${swap.hash}`}>
                            {getTokenByAddress(swap.details.srcTokenAddress).name}: {swap.details.srcAmount.toString()} →{getTokenByAddress(swap.details.dstTokenAddress).name}: {swap.details.dstAmount.toString()}
                            <br />
                            Status: {swap.details.status === 0 ? 'OPEN' : swap.details.status === 1 ? 'CLOSED' : 'CANCELED'}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserSwapsList;
