import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import { ethers } from 'ethers';
import Layout from '../components/Layout';
import SwapOffer from '../components/SwapOffer';
import SwapOffersList from '../components/SwapOffersList';
import CompletedSwapsList from '../components/CompletedSwapsList';
import { getTokenImageUrl } from '../utils/tokens';
import styled from '@emotion/styled';


const StyledBox = styled(Box)`
    min-height: calc(100vh - 100px);
    background: linear-gradient(to bottom, #1b3a47, #45bbd6);
    padding-top: 3em;
`;

export default () => {
    const [activeTab, setActiveTab] = useState('createSwapOffer');
    const [activeSwapOffersListTab, setActiveSwapOffersListTab] = useState(null);
    const [srcAmount, setSrcAmount] = useState('0.0');
    const [dstAmount, setDstAmount] = useState('0.0');
    const [dstAddress, setDstAddress] = useState(ethers.constants.AddressZero);
    const [selectedSrcToken, setSelectedSrcToken] = useState(null);
    const [selectedDstToken, setSelectedDstToken] = useState(null);
    const [swapOfferButtonText, setSwapOfferButtonText] = useState('Connect wallet');
    const [tokenApproved, setTokenApproved] = useState(false);
    const [expiresInHours, setExpiresInHours] = useState(0);
    const [expiresInMinutes, setExpiresInMinutes] = useState(0);
    const [expirationEnabled, setExpirationEnabled] = useState(false);
    const [partialFillEnabled, setPartialFillEnabled] = useState(false);
    const selectedSrcTokenImg = getTokenImageUrl(selectedSrcToken);
    const selectedDstTokenImg = getTokenImageUrl(selectedDstToken);
    const router = useRouter();

    useEffect(() => {
        const tab = router.query.tab;

        if (tab && ['createSwapOffer', 'swapOffersList', 'completedSwapsList'].includes(tab)) {
            setActiveTab(tab);
        }

        const listTab = router.query.listTab;

        if (listTab && ['yourSwapOffers', 'swapOffersForYou'].includes(listTab)) {
            setActiveSwapOffersListTab(listTab);
        }
    }, [router.query.tab]);

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} activeSwapOffersListTab={activeSwapOffersListTab} setActiveSwapOffersListTab={setActiveSwapOffersListTab}>
            {activeTab === 'createSwapOffer' && (
            <SwapOffer
                srcAmount={srcAmount} setSrcAmount={setSrcAmount}
                dstAmount={dstAmount} setDstAmount={setDstAmount}
                dstAddress={dstAddress} setDstAddress={setDstAddress}
                selectedSrcToken={selectedSrcToken} setSelectedSrcToken={setSelectedSrcToken}
                selectedDstToken={selectedDstToken} setSelectedDstToken={setSelectedDstToken}
                swapOfferButtonText={swapOfferButtonText} setSwapOfferButtonText={setSwapOfferButtonText}
                tokenApproved={tokenApproved} setTokenApproved={setTokenApproved}
                expiresInHours={expiresInHours} setExpiresInHours={setExpiresInHours}
                expiresInMinutes={expiresInMinutes} setExpiresInMinutes={setExpiresInMinutes}
                expirationEnabled={expirationEnabled} setExpirationEnabled={setExpirationEnabled}
                partialFillEnabled={partialFillEnabled} setPartialFillEnabled={setPartialFillEnabled}
                selectedSrcTokenImg={selectedSrcTokenImg}
                selectedDstTokenImg={selectedDstTokenImg}
            />)}
            {activeTab === 'swapOffersList' && <SwapOffersList activeSwapOffersListTab={activeSwapOffersListTab} />}
            {activeTab === 'completedSwapsList' && <CompletedSwapsList />}
        </Layout>
    );
};
