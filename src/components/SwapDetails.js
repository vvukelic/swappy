import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Typography } from '@mui/material';
import { getSwap, takeSwap, cancelSwap, approveToken, getEthBalance, getAllowance } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getTokenByAddress } from '../utils/tokens';
import MainContentContainer from './MainContentContainer';
import BorderSection from './BorderSection';

const contractAddresses = require('../contracts/contract-address.json');

function SwapDetails({ hash }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [swapDetails, setSwapDetails] = useState(null);
    const [tokenApproved, setTokenApproved] = useState(false);
    const [swapButtonText, setSwapButtonText] = useState('Connect wallet');

    useEffect(() => {
        async function checkTokenApproved() {
            let tokenBalance = null;

            if (swapDetails.dstTokenAddress === ethers.constants.AddressZero) {
                tokenBalance = await getEthBalance(defaultAccount);
                setTokenApproved(tokenBalance > 0);
            } else {
                tokenBalance = await getAllowance(swapDetails.dstTokenAddress, defaultAccount, contractAddresses.SwapManager[network]);
                setTokenApproved(tokenBalance > 0);
            }
        }

        if (swapDetails) {
            checkTokenApproved();
        }
    }, [defaultAccount, network, swapDetails]);

    useEffect(() => {
        if (defaultAccount && swapDetails) {
            if (tokenApproved) {
                setSwapButtonText('Take swap');
            } else {
                if (swapDetails.dstTokenAddress === ethers.constants.AddressZero) {
                    setSwapButtonText('ETH balance too low');
                } else {
                    setSwapButtonText(`Approve ${getTokenByAddress(swapDetails.dstTokenAddress).name} Token`);
                }
            }
        }
    }, [defaultAccount, swapDetails, tokenApproved]);

    useEffect(() => {
        async function getSwapDetails() {
            try {
                const swap = await getSwap(contractAddresses.SwapManager[network], hash);
                setSwapDetails(swap);
            } catch (err) {
                console.error(err);
            }
        }

        if (network && hash) {
            getSwapDetails();
        }
    }, [hash, network]);

    const handleTakeSwap = async () => {
        if (tokenApproved) {
            try {
                const receipt = await takeSwap(contractAddresses.SwapManager[network], hash);

                if (receipt.status === 1) {
                    console.log('Swap taken successfully!');
                } else {
                    console.error('Failed to take swap');
                }
                window.location.reload();
            } catch (err) {
                console.error(err);
            }
        } else {
            const approved = await approveToken(swapDetails.dstTokenAddress, contractAddresses.SwapManager[network]);

            if (approved) {
                setTokenApproved(true);
            } else {
                // Handle error in UI, approval failed
            }
        }
    };

    const handleCancelSwap = async () => {
        try {
            const receipt = await cancelSwap(contractAddresses.SwapManager[network], hash);

            if (receipt.status === 1) {
                console.log('Swap canceled successfully!');
            } else {
                console.error('Failed to cancel swap');
            }
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    if (!swapDetails) {
        return <div>Loading...</div>;
    }

    return (
        <MainContentContainer>
            <BorderSection title='You get'>
                <Typography>Source Token: {getTokenByAddress(swapDetails.srcTokenAddress).name}</Typography>
            </BorderSection>

            <p>Source Token Address: {swapDetails.srcTokenAddress}</p>
            <p>Source Amount: {swapDetails.srcAmount.toString()}</p>
            <p>Destination Token: {getTokenByAddress(swapDetails.dstTokenAddress).name}</p>
            <p>Destination Token Address: {swapDetails.dstTokenAddress}</p>
            <p>Destination Amount: {swapDetails.dstAmount.toString()}</p>
            <p>Destination Address: {swapDetails.dstAddress}</p>
            <p>Expiration: {swapDetails.expiration.toString()}</p>
            {/* <p>Minimum Destination Amount: {swapDetails.minDstAmount.toString()}</p> */}
            <p>Status: {swapDetails.status === 0 ? 'OPEN' : swapDetails.status === 1 ? 'CLOSED' : 'CANCELED'}</p>

            {swapDetails.status === 0 && (swapDetails.dstAddress === ethers.constants.AddressZero || swapDetails.dstAddress === defaultAccount) && swapDetails.srcAddress !== defaultAccount && <button onClick={handleTakeSwap}>{swapButtonText}</button>}

            {swapDetails.status === 0 && swapDetails.srcAddress === defaultAccount && <button onClick={handleCancelSwap}>Cancel</button>}
        </MainContentContainer>
    );
}

export default SwapDetails;
