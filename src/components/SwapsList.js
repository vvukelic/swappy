import React from 'react';
import Box from '@mui/material/Box';
import { useWalletConnect } from '../hooks/useWalletConnect';
import UserSwapsList from './UserSwapsList';

function SwapsList() {
    const { defaultAccount, connectWallet, network } = useWalletConnect();

    return (
        <Box>
            {defaultAccount && <UserSwapsList userAddress={defaultAccount} network={network} />}
        </Box>
    );
}

export default SwapsList;