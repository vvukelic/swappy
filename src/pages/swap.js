import React, { useState } from 'react';
import { Box } from '@mui/material';
import Layout from '../components/Layout';
import Swap from '../components/Swap';
import SwapsList from '../components/SwapsList';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Layout setActiveTab={setActiveTab}>
                <Box sx={{ minHeight: 'calc(100vh - 100px)', background: 'linear-gradient(to bottom, #1B3A47, #45BBD6)' }}>
                    {activeTab === 'createSwap' && <Swap />}
                    {activeTab === 'swapsList' && <SwapsList />}
                </Box>
            </Layout>
        </ThemeProvider>
    );
};
