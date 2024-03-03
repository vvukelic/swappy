import React from 'react';
import Box from '@mui/material/Box';
import MainContentContainer from './MainContentContainer';
import { useWalletConnect } from '../hooks/useWalletConnect';
import UserSwapOffersList from './UserSwapOffersList';


function SwapOffersList({ activeSwapOffersListTab }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();

    return (
        <MainContentContainer>
            <Box>{defaultAccount && <UserSwapOffersList userAddress={defaultAccount} network={network} activeSwapOffersListTab={activeSwapOffersListTab} />}</Box>
        </MainContentContainer>
    );
}

export default SwapOffersList;
