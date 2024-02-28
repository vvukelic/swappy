import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Grid, Typography, Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import styled from '@emotion/styled';
import { createSwapForOffer, cancelSwapOffer, approveToken, getEthBalance, getAllowance } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import MainContentContainer from './MainContentContainer';
import BorderSection from './BorderSection';
import SwapOfferDetailsTokenInfo from './SwapOfferDetailsTokenInfo';
import { getSwapOffer, sliceAddress } from '../utils/general';
import PrimaryButton from './PrimaryButton';
import useTransactionModal from '../hooks/useTransactionModal';
import TransactionStatusModal from './TransactionStatusModal';
import SwapStatusChip from './SwapOfferStatusChip';


const contractAddresses = require('../contracts/contract-address.json');

const StyledBox = styled(Box)`
    min-height: 2.5em;
`;

function SwapOfferDetails({ hash }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const { txModalOpen, setTxModalOpen, txStatus, txStatusTxt, txErrorTxt, startTransaction, endTransaction } = useTransactionModal();
    const [swapOffer, setSwapOffer] = useState(null);
    const [swapSrcAmount, setSwapSrcAmount] = useState(null);
    const [swapDstAmount, setSwapDstAmount] = useState(null);
    const [tokenApproved, setTokenApproved] = useState(false);
    const [swapButtonText, setSwapButtonText] = useState('Connect wallet');

    useEffect(() => {
        async function checkTokenApproved() {
            let tokenBalance = null;

            if (swapOffer.dstTokenAddress === ethers.constants.AddressZero) {
                tokenBalance = await getEthBalance(defaultAccount);
                setTokenApproved(tokenBalance > 0);
            } else {
                tokenBalance = await getAllowance(swapOffer.dstTokenAddress, defaultAccount, contractAddresses.SwapManager[network]);
                setTokenApproved(tokenBalance > 0);
            }
        }

        if (swapOffer) {
            checkTokenApproved();
        }
    }, [defaultAccount, network, swapOffer]);

    useEffect(() => {
        if (defaultAccount && swapOffer) {
            if (tokenApproved) {
                setSwapButtonText('Take swap');
            } else {
                if (swapOffer.dstTokenAddress === ethers.constants.AddressZero) {
                    setSwapButtonText('ETH balance too low');
                } else {
                    setSwapButtonText(`Approve ${swapOffer.dstTokenName} Token`);
                }
            }
        }
    }, [defaultAccount, swapOffer, tokenApproved]);

    useEffect(() => {
        async function getSwapOfferDetails() {
            try {
                const swapOffer = await getSwapOffer(contractAddresses.SwapManager[network], hash, network);
                setSwapOffer(swapOffer);
                setSwapSrcAmount(swapOffer.srcAmount);
                setSwapDstAmount(swapOffer.dstAmount);
            } catch (err) {
                console.error(err);
            }
        }

        if (network && hash) {
            getSwapOfferDetails();
        }
    }, [hash, network]);

    useEffect(() => {
        if (swapOffer) {
            if (swapDstAmount >= swapOffer.dstAmount) {
                setSwapSrcAmount(swapOffer.srcAmount);
                setSwapDstAmount(swapOffer.dstAmount);
            } else {
                setSwapSrcAmount(swapDstAmount * swapOffer.exchangeRate);
            }
        }
    }, [swapDstAmount]);

    const handleCreateSwapForOffer = async () => {
        if (tokenApproved) {
            try {
                startTransaction(`Please go to your wallet and confirm the transaction for taking the swap.`);

                try {
                    const receipt = await createSwapForOffer(contractAddresses.SwapManager[network], hash, swapOffer.dstToken.networkSpecificAddress[network], swapDstAmount, swapOffer.feeAmount);

                    if (receipt.status === 1) {
                        endTransaction(true, `Swap taken successfully!`);
                        console.log('Swap taken successfully!');
                    } else {
                        endTransaction(false, `Failed to take the swap.`);
                        console.error('Failed to take swap');
                    }
                } catch (error) {
                    endTransaction(false, 'Failed to take the swap.', error.toString());
                    return;
                }

                window.location.reload();
            } catch (err) {
                console.error(err);
            }
        } else {
            startTransaction(`Please go to your wallet and approve ${swapOffer.dstTokenName}`);

            try {
                const receipt = await approveToken(swapOffer.dstTokenAddress, contractAddresses.SwapManager[network]);

                if (receipt.status === 1) {
                    endTransaction(true, `You successfuly approved ${swapOffer.dstTokenName}!`);
                    setTokenApproved(true);
                } else {
                    endTransaction(false, `There was an error approving ${swapOffer.dstTokenName}.`);
                }
            } catch (error) {
                endTransaction(false, `There was an error approving ${swapOffer.dstTokenName}.`, error.toString());
                return;
            }
        }
    };

    const handleCancelSwapOffer = async () => {
        try {
            startTransaction(`Please go to your wallet and confirm the transaction for canceling the swap offer.`);

            try {
                const receipt = await cancelSwapOffer(contractAddresses.SwapManager[network], hash);

                if (receipt.status === 1) {
                    endTransaction(true, `Swap offer canceled successfully!`);
                    console.log('Swap offer canceled successfully!');
                } else {
                    endTransaction(false, `Failed to cancel the swap offer.`);
                    console.error('Failed to cancel the swap offer.');
                }
            } catch (error) {
                endTransaction(false, 'Failed to cancel the swap offer.', error.toString());
                return;
            }

            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    if (!swapOffer) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <MainContentContainer sx={{ width: '100%' }}>
                <SwapOfferDetailsTokenInfo token={swapOffer.dstToken} amount={swapDstAmount} setAmount={setSwapDstAmount} tokenDecimals={swapOffer.dstTokenDecimals} labelText='You send' sx={{ width: '100%' }} />

                <Grid item xs={12} justifyContent='center' alignItems='center' sx={{ padding: '0 !important' }}>
                    <IconButton variant='outlined' disabled>
                        <ArrowDownwardIcon />
                    </IconButton>
                </Grid>

                <SwapOfferDetailsTokenInfo token={swapOffer.srcToken} amount={swapSrcAmount} setAmount={setSwapSrcAmount} tokenDecimals={swapOffer.srcTokenDecimals} labelText='You receive' />

                <Grid item sx={{ height: '42px' }} />

                <BorderSection title='Swap offer details'>
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
                                <SwapStatusChip status={swapOffer.readableStatus} />
                            </StyledBox>
                            <StyledBox>
                                <Typography>{swapOffer.feeAmountInBaseUnit} ETH</Typography>
                            </StyledBox>
                            <StyledBox>
                                <Typography>{swapOffer.displayExpirationTime ? swapOffer.displayExpirationTime : 'not defined'}</Typography>
                            </StyledBox>
                            <StyledBox>
                                <Typography>{sliceAddress(swapOffer.dstAddress)}</Typography>
                            </StyledBox>
                        </Grid>
                    </Grid>
                </BorderSection>

                {swapOffer.readableStatus === 'OPENED' && (swapOffer.dstAddress === ethers.constants.AddressZero || swapOffer.dstAddress === defaultAccount) && swapOffer.srcAddress !== defaultAccount && (
                    <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                        <PrimaryButton onClick={handleCreateSwapForOffer} buttonText={swapButtonText} />
                    </Grid>
                )}

                {swapOffer.readableStatus === 'OPENED' && swapOffer.srcAddress === defaultAccount && (
                    <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                        <PrimaryButton onClick={handleCancelSwapOffer} buttonText='Cancel' />
                    </Grid>
                )}
            </MainContentContainer>
            <TransactionStatusModal open={txModalOpen} status={txStatus} statusTxt={txStatusTxt} errorTxt={txErrorTxt} onClose={() => setTxModalOpen(false)} />
        </>
    );
}

export default SwapOfferDetails;
