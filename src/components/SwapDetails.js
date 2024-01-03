import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Chip, Grid, Typography, Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import styled from '@emotion/styled';
import { getSwap, takeSwap, cancelSwap, approveToken, getEthBalance, getAllowance, getTokenDecimals } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getTokenByAddress } from '../utils/tokens';
import MainContentContainer from './MainContentContainer';
import BorderSection from './BorderSection';
import SwapDetailsTokenInfo from './SwapDetailsTokenInfo';
import { sliceAddress, toBaseUnit } from '../utils/general';
import PrimaryButton from './PrimaryButton';


const contractAddresses = require('../contracts/contract-address.json');

function SwapDetails({ hash }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [swapDetails, setSwapDetails] = useState(null);
    const [tokenApproved, setTokenApproved] = useState(false);
    const [swapButtonText, setSwapButtonText] = useState('Connect wallet');
    const [srcToken, setSrcToken] = useState(null);
    const [srcAmount, setSrcAmount] = useState(0);
    const [dstToken, setDstToken] = useState(null);
    const [dstAmount, setDstAmount] = useState(0);
    const [feeAmount, setFeeAmount] = useState(0);
    const [expirationDatetime, setExpirationDatetime] = useState(null);

    const StyledChip = styled(Chip)`
        color: white;
    `;

    const StyledBox = styled(Box)`
        min-height: 2.5em;
    `;

    useEffect(() => {
        async function formatSwapDetails() {
            const srcTokenAmount = await toBaseUnit(swapDetails.srcAmount, swapDetails.srcTokenAddress);
            setSrcAmount(srcTokenAmount);
            setSrcToken(getTokenByAddress(swapDetails.srcTokenAddress, network));

            const dstTokenAmount = await toBaseUnit(swapDetails.dstAmount, swapDetails.dstTokenAddress);
            setDstAmount(dstTokenAmount);
            setDstToken(getTokenByAddress(swapDetails.dstTokenAddress, network));

            setFeeAmount(ethers.utils.formatUnits(swapDetails.feeAmount, 'ether'));

            if (swapDetails.expiration.toString() !== '0') {
                setExpirationDatetime(new Date(swapDetails.expiration * 1000).toLocaleString());
            }
        }

        if (swapDetails) {
            formatSwapDetails();
        }
    }, [swapDetails]);

    useEffect(() => {
        async function checkTokenApproved() {
            let tokenBalance = null;

            if (swapDetails.dstTokenAddress === ethers.constants.AddressZero) {
                tokenBalance = await getEthBalance(defaultAccount);
                setTokenApproved(tokenBalance > 0);
            } else {
                tokenBalance = await getAllowance(swapDetails.dstTokenAddress, defaultAccount, contractAddresses.SwapManager[network]);
                setTokenApproved(tokenBalance > 0);
            }
        }

        if (swapDetails) {
            checkTokenApproved();
        }
    }, [defaultAccount, network, swapDetails]);

    useEffect(() => {
        if (defaultAccount && swapDetails) {
            if (tokenApproved) {
                setSwapButtonText('Take swap');
            } else {
                if (swapDetails.dstTokenAddress === ethers.constants.AddressZero) {
                    setSwapButtonText('ETH balance too low');
                } else {
                    setSwapButtonText(`Approve ${getTokenByAddress(swapDetails.dstTokenAddress, network).name} Token`);
                }
            }
        }
    }, [defaultAccount, swapDetails, tokenApproved]);

    useEffect(() => {
        async function getSwapDetails() {
            try {
                const swap = await getSwap(contractAddresses.SwapManager[network], hash);
                setSwapDetails(swap);
            } catch (err) {
                console.error(err);
            }
        }

        if (network && hash) {
            getSwapDetails();
        }
    }, [hash, network]);

    const handleTakeSwap = async () => {
        if (tokenApproved) {
            try {
                const receipt = await takeSwap(contractAddresses.SwapManager[network], hash, dstToken.networkSpecificAddress[network], dstAmount, swapDetails.feeAmount);

                if (receipt.status === 1) {
                    console.log('Swap taken successfully!');
                } else {
                    console.error('Failed to take swap');
                }
                window.location.reload();
            } catch (err) {
                console.error(err);
            }
        } else {
            const approved = await approveToken(swapDetails.dstTokenAddress, contractAddresses.SwapManager[network]);

            if (approved) {
                setTokenApproved(true);
            } else {
                // Handle error in UI, approval failed
            }
        }
    };

    const handleCancelSwap = async () => {
        try {
            const receipt = await cancelSwap(contractAddresses.SwapManager[network], hash);

            if (receipt.status === 1) {
                console.log('Swap canceled successfully!');
            } else {
                console.error('Failed to cancel swap');
            }
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    if (!swapDetails) {
        return <div>Loading...</div>;
    }

    return (
        <MainContentContainer sx={{ width: '100%' }}>
            <SwapDetailsTokenInfo token={dstToken} amount={dstAmount} labelText='You send' sx={{ width: '100%' }} />

            <Grid item xs={12} justifyContent='center' alignItems='center' sx={{ padding: '0 !important' }}>
                <IconButton variant='outlined' disabled>
                    <ArrowDownwardIcon />
                </IconButton>
            </Grid>

            <SwapDetailsTokenInfo token={srcToken} amount={srcAmount} labelText='You receive' />

            <Grid item sx={{ height: '42px' }} />

            <BorderSection title='Swap details'>
                <Grid container direction='row' alignItems='flex-start' sx={{ padding: '0.5em' }}>
                    <Grid item xs={4} textAlign='right'>
                        <StyledBox>
                            <Typography>Status:</Typography>
                        </StyledBox>
                        <StyledBox>
                            <Typography>Swappy's fee:</Typography>
                        </StyledBox>
                        <StyledBox>
                            <Typography>Expires:</Typography>
                        </StyledBox>
                        <StyledBox>
                            <Typography>Private swap:</Typography>
                        </StyledBox>
                    </Grid>
                    <Grid item xs={8} textAlign='center'>
                        <StyledBox>
                            <StyledChip label={swapDetails.status === 0 ? 'OPENED' : swapDetails.status === 1 ? 'CLOSED' : 'CANCELED'} />
                        </StyledBox>
                        <StyledBox>
                            <Typography>{feeAmount} ETH</Typography>
                        </StyledBox>
                        <StyledBox>
                            <Typography>{expirationDatetime ? expirationDatetime : 'not defined'}</Typography>
                        </StyledBox>
                        <StyledBox>
                            <Typography>{sliceAddress(swapDetails.dstAddress)}</Typography>
                        </StyledBox>
                    </Grid>
                </Grid>
            </BorderSection>

            {swapDetails.status === 0 && (swapDetails.dstAddress === ethers.constants.AddressZero || swapDetails.dstAddress === defaultAccount) && swapDetails.srcAddress !== defaultAccount && (
                <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                    <PrimaryButton onClick={handleTakeSwap} buttonText={swapButtonText} />
                </Grid>
            )}

            {swapDetails.status === 0 && swapDetails.srcAddress === defaultAccount && (
                <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                    <PrimaryButton onClick={handleCancelSwap} buttonText='Cancel' />
                </Grid>
            )}
        </MainContentContainer>
    );
}

export default SwapDetails;
