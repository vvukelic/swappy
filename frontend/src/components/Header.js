import React, { Component, useState } from "react";
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Card, CardMedia } from "@mui/material";
import provider from "../web3Provider";

function Header() {
    const [defaultAccount, setDefaultAccount] = useState("connect");

    const onConnectBtnClick = async () => {
        try {
            const accounts = await provider.send("eth_requestAccounts", []);
            setDefaultAccount(`${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        } catch (error) {
        }
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" elevation={0}>
                <Toolbar sx={{ backgroundColor: '#2a374e' }}>
                    <Card>
                        <CardMedia
                            sx={{
                                width: '60px',
                                height: '60px',
                            }}
                            image="/images/ninex-logo.png"
                        />
                    </Card>
                    <Box flexGrow={1} /> 
                    <Button onClick={onConnectBtnClick} color="inherit">{defaultAccount}</Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
}

export default Header;
