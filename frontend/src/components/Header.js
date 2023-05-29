import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Card, CardMedia, Typography } from '@mui/material';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { fetchEthBalance } from '../utils/web3';

function Header() {
    const { defaultAccount, connectWallet } = useWalletConnect();
    const [ethBalance, setEthBalance] = useState(null);

    useEffect(() => {
        const fetchBalance = async () => {
            if (defaultAccount) {
                const balance = await fetchEthBalance(defaultAccount);
                setEthBalance(balance);
            }
        };

        fetchBalance();
    }, [defaultAccount]);

    let connectBtnText = 'Connect';
    if (defaultAccount) {
        connectBtnText = `${defaultAccount.slice(0, 6)}...${defaultAccount.slice(-4)}`;
    }

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
                            image='/images/ninex-logo-var1.png'
                        />
                    </Card>
                    <Box flexGrow={1} />
                    {ethBalance !== null && (
                        <Typography sx={{ marginRight: '10px' }} variant='h6' color='inherit'>
                            {ethBalance} ETH
                        </Typography>
                    )}
                    <Button onClick={connectWallet} color='inherit'>
                        {connectBtnText}
                    </Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
}

export default Header;
