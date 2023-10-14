import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import NetworkSelector from './NetworkSelector';
import { Card, CardMedia, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import styled from '@emotion/styled';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getEthBalance, getNetworkName } from '../utils/web3';


function Header({ activeTab, setActiveTab }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [ethBalance, setEthBalance] = useState(null);
    const [networkName, setNetworkName] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width:600px)');

    const StyledTabButton = styled(Button)`
        margin-left: 10px;
        color: white;
        background-color: ${(props) => (props.isActive ? '#396777' : 'transparent')};

        &:hover {
            background-color: ${(props) => (props.isActive ? '#396777' : '#396777')};
        }
    `;

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

    const CommonHeaderItems = () => (
        <>
            <StyledTabButton isActive={activeTab === 'createSwap'} onClick={() => setActiveTab('createSwap')}>
                Create Swap
            </StyledTabButton>
            <StyledTabButton isActive={activeTab === 'swapsList'} onClick={() => setActiveTab('swapsList')}>
                Swaps List
            </StyledTabButton>
            <Box flexGrow={1} />
            {ethBalance !== null && (
                <Typography sx={{ marginRight: '15px' }} variant='h6' color='white'>
                    {ethBalance} ETH
                </Typography>
            )}
            {network !== null && <NetworkSelector networkName={networkName} sx={{ marginRight: '15px' }} />}
            <Button onClick={connectWallet} sx={{ backgroundColor: '#F7B93E', '&:hover': { backgroundColor: '#FFD684' }, color: 'black' }}>
                {connectBtnText}
            </Button>
        </>
    );

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
                    {isMobile ? (
                        <>
                            <Box flexGrow={1} />
                            <IconButton edge='start' color='inherit' aria-label='menu' onClick={() => setDrawerOpen(true)}>
                                <MenuIcon />
                            </IconButton>
                            <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiPaper-root': { backgroundColor: '#1B3A47' } }}>
                                <Box sx={{ width: 250, padding: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <CommonHeaderItems />
                                </Box>
                            </Drawer>
                        </>
                    ) : (
                        <CommonHeaderItems />
                    )}
                </Toolbar>
            </AppBar>
        </Box>
    );
}

export default Header;
