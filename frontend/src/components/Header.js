import React, { Component, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Card, CardMedia } from '@mui/material';
import { getProvider, fetchEthBalance } from '../utils';

function Header() {
    const [defaultAccount, setDefaultAccount] = useState(null);
    const [connectBtnText, setConnectBtnText] = useState('connect');
    const [ethBalance, setEthBalance] = useState(null);

    const onConnectBtnClick = async () => {
        try {
            const accounts = await getProvider().send('eth_requestAccounts', []);
            setDefaultAccount(accounts[0]);
            setConnectBtnText(`${defaultAccount.slice(0, 6)}...${defaultAccount.slice(-4)}`);
        } catch (error) {}
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position='static' elevation={0}>
                <Toolbar sx={{ backgroundColor: '#2a374e' }}>
                    <Card>
                        <CardMedia
                            sx={{
                                width: '60px',
                                height: '60px',
                            }}
                            image='/images/ninex-logo.png'
                        />
                    </Card>
                    <Box flexGrow={1} />
                    {ethBalance !== null && (
                        <Typography sx={{ marginRight: '10px' }} variant='h6' color='inherit'>
                            {ethBalance} ETH
                        </Typography>
                    )}
                    <Button onClick={onConnectBtnClick} color='inherit'>
                        {connectBtnText}
                    </Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
}

export default Header;
