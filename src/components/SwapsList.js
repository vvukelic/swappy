import React from 'react';
import Box from '@mui/material/Box';
import MainContentContainer from './MainContentContainer';
import { useWalletConnect } from '../hooks/useWalletConnect';
import UserSwapsList from './UserSwapsList';


function SwapsList() {
    const { defaultAccount, connectWallet, network } = useWalletConnect();

    return (
        <MainContentContainer>
            <Box>{defaultAccount && <UserSwapsList userAddress={defaultAccount} network={network} />}</Box>
        </MainContentContainer>
    );
}

export default SwapsList;
