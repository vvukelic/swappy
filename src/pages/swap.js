import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import { ethers } from 'ethers';
import Layout from '../components/Layout';
import Swap from '../components/Swap';
import SwapsList from '../components/SwapsList';
import { getCoinImageUrl } from '../utils/tokens';
import styled from '@emotion/styled';


const StyledBox = styled(Box)`
    min-height: calc(100vh - 100px);
    background: linear-gradient(to bottom, #1b3a47, #45bbd6);
    padding-top: 3em;
`;

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
    const router = useRouter();

    useEffect(() => {
        const tab = router.query.tab;

        if (tab && ['createSwap', 'swapsList'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [router.query.tab]);

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
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
        </Layout>
    );
};
