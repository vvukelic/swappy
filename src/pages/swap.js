import React, { useState } from 'react';
import { Box } from '@mui/material';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ethers } from 'ethers';
import Layout from '../components/Layout';
import Swap from '../components/Swap';
import SwapsList from '../components/SwapsList';
import { getCoinImageUrl } from '../utils/tokens';


const theme = createTheme({
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    // background: 'linear-gradient(to bottom, #1B3A47, #45BBD6)',
                },
            },
        },
    },
});

export default () => {
    const [activeTab, setActiveTab] = useState('createSwap');
    const [srcAmount, setSrcAmount] = useState('0.0');
    const [dstAmount, setDstAmount] = useState('0.0');
    const [dstAddress, setDstAddress] = useState(ethers.constants.AddressZero);
    const [selectedSrcCoin, setSelectedSrcCoin] = useState(null);
    const [selectedDstCoin, setSelectedDstCoin] = useState(null);
    const [swapButtonText, setSwapButtonText] = useState('Connect wallet');
    const [tokenApproved, setTokenApproved] = useState(false);
    const [expiresInHours, setExpiresInHours] = useState(0);
    const [expiresInMinutes, setExpiresInMinutes] = useState(0);
    const [expirationEnabled, setExpirationEnabled] = useState(false);
    const selectedSrcCoinImg = getCoinImageUrl(selectedSrcCoin);
    const selectedDstCoinImg = getCoinImageUrl(selectedDstCoin);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Layout setActiveTab={setActiveTab}>
                <Box sx={{ minHeight: 'calc(100vh - 100px)', background: 'linear-gradient(to bottom, #1B3A47, #45BBD6)' }}>
                    {activeTab === 'createSwap' && (
                    <Swap
                        srcAmount={srcAmount} setSrcAmount={setSrcAmount}
                        dstAmount={dstAmount} setDstAmount={setDstAmount}
                        dstAddress={dstAddress} setDstAddress={setDstAddress}
                        selectedSrcCoin={selectedSrcCoin} setSelectedSrcCoin={setSelectedSrcCoin}
                        selectedDstCoin={selectedDstCoin} setSelectedDstCoin={setSelectedDstCoin}
                        swapButtonText={swapButtonText} setSwapButtonText={setSwapButtonText}
                        tokenApproved={tokenApproved} setTokenApproved={setTokenApproved}
                        expiresInHours={expiresInHours} setExpiresInHours={setExpiresInHours}
                        expiresInMinutes={expiresInMinutes} setExpiresInMinutes={setExpiresInMinutes}
                        expirationEnabled={expirationEnabled} setExpirationEnabled={setExpirationEnabled}
                        selectedSrcCoinImg={selectedSrcCoinImg}
                        selectedDstCoinImg={selectedDstCoinImg}
                    />)}
                    {activeTab === 'swapsList' && <SwapsList />}
                </Box>
            </Layout>
        </ThemeProvider>
    );
};
