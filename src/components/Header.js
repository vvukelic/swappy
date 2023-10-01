import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Card, CardMedia, Typography } from '@mui/material';
import Link from 'next/link';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getEthBalance, getNetworkName } from '../utils/web3';
import NetworkSelector from './NetworkSelector';


function Header({ setActiveTab }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [ethBalance, setEthBalance] = useState(null);
    const [networkName, setNetworkName] = useState(null);

    useEffect(() => {
        const fetchBalance = async () => {
            if (defaultAccount) {
                let balance = await getEthBalance(defaultAccount);
                balance = ethers.utils.formatEther(balance);
                balance = parseFloat(balance).toFixed(2);
                setEthBalance(balance);
            }
        };

        fetchBalance();
    }, [defaultAccount, network]);

    useEffect(() => {
        const updateNetworkName = async () => {
            if (network) {
                const name = await getNetworkName(network);
                setNetworkName(name);
            }
        };

        updateNetworkName();
    }, [network]);

    let connectBtnText = 'Connect';
    if (defaultAccount) {
        connectBtnText = `${defaultAccount.slice(0, 6)}...${defaultAccount.slice(-4)}`;
    }

    return (
        <Box sx={{ flexGrow: 1, padding: 0, margin: 0 }}>
            <AppBar position='sticky' elevation={0} component='nav'>
                <Toolbar sx={{ backgroundColor: '#1B3A47' }}>
                    <Card
                        sx={{
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                        }}
                    >
                        <CardMedia
                            sx={{
                                width: '100px',
                                height: '100px',
                                backgroundColor: 'transparent',
                            }}
                            image='/images/swappy_logo.png'
                        />
                    </Card>
                    <Button sx={{ marginLeft: '10px', color: 'white' }} onClick={() => setActiveTab('createSwap')}>
                        Create Swap
                    </Button>
                    <Button sx={{ marginLeft: '10px', color: 'white' }} onClick={() => setActiveTab('swapsList')}>
                        Swaps List
                    </Button>
                    <Box flexGrow={1} />
                    {ethBalance !== null && (
                        <Typography sx={{ marginRight: '15px' }} variant='h6' color='inherit'>
                            {ethBalance} ETH
                        </Typography>
                    )}
                    {network !== null && <NetworkSelector networkName={networkName} sx={{ marginRight: '15px' }} />}
                    <Button onClick={connectWallet} sx={{ backgroundColor: '#F7B93E', '&:hover': { backgroundColor: '#FFD684' }, color: 'black' }}>
                        {connectBtnText}
                    </Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
}

export default Header;
