import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Grid, Typography, Box, Paper, TableBody, TableRow, Tooltip } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import styled from '@emotion/styled';
import { createSwapForOffer, cancelSwapOffer, approveToken, getNativeTokenBalance, getAllowance } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import MainContentContainer from './MainContentContainer';
import BorderSection from './BorderSection';
import SwapOfferDetailsPartialFillTokenForm from './SwapOfferDetailsPartialFillTokenForm';
import SwapOfferDetailsTokenInfo from './SwapOfferDetailsTokenInfo';
import SwapOfferPercentageFilledLabel from './SwapOfferPercentageFilledLabel';
import { sliceAddress } from '../utils/general';
import { StyledTableContainer, StyledTable, StyledTableHead, StyledTableRow, StyledTableCell, StyledHeaderTableCell } from '../sharedStyles/tableStyles';
import PrimaryButton from './PrimaryButton';
import useTransactionModal from '../hooks/useTransactionModal';
import TransactionStatusModal from './TransactionStatusModal';
import SwapStatusChip from './SwapOfferStatusChip';
import SwapOffer from '../utils/swapOffer';
import { Truncate } from '../sharedStyles/general';
import networks from '../data/networks';


const contractAddresses = require('../contracts/contract-address.json');

const StyledBox = styled(Box)`
    min-height: 2.5em;
`;

const StyledTypography = styled(Typography)`
    display: inline-flex;

    & > *:first-of-type {
        margin-right: 0.3em;
    }
`;

const StyledExchangeRate = styled(Typography)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;

    @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const StyledAmountAndToken = styled.div`
    display: inline-flex;
    align-items: center;
    margin-left: 0.3em;

    @media (max-width: 600px) {
        margin-left: 0;
    }
`;

const StyledAttributeKey = styled(Typography)`
    font-weight: bold;
`;

const StyledInfoValues = styled(Grid)`
    padding-left: 2em;

    @media (max-width: 600px) {
        padding-left: 0.8em;
    }
`;

function SwapOfferDetails({ hash }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const { txModalOpen, setTxModalOpen, txStatus, txStatusTxt, txErrorTxt, startTransaction, endTransaction } = useTransactionModal();
    const [swapOffer, setSwapOffer] = useState(null);
    const [swapSrcAmount, setSwapSrcAmount] = useState(null);
    const [swapDstAmount, setSwapDstAmount] = useState(null);
    const [tokenApproved, setTokenApproved] = useState(false);
    const [swapButtonText, setSwapButtonText] = useState('Connect wallet');
    const isMobile = useMediaQuery('(max-width:600px)');

    useEffect(() => {
        async function checkTokenApproved() {
            let tokenBalance = null;

            if (swapOffer.dstTokenAddress === ethers.constants.AddressZero) {
                tokenBalance = await getNativeTokenBalance(defaultAccount);
                setTokenApproved(tokenBalance > 0);
            } else {
                tokenBalance = await getAllowance(swapOffer.dstTokenAddress, defaultAccount, contractAddresses[network].SwappyManager);
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
                    setSwapButtonText(`${networks[network].wrappedNativeCurrencySymbol} balance too low`);
                } else {
                    setSwapButtonText(`Approve ${swapOffer.dstTokenName} Token`);
                }
            }
        }
    }, [defaultAccount, swapOffer, tokenApproved]);

    useEffect(() => {
        async function getSwapOfferDetails() {
            try {
                const swapOffer = new SwapOffer(network);
                await swapOffer.load(hash);
                setSwapOffer(swapOffer);
                setSwapSrcAmount(swapOffer.remainingSrcAmountSum);
                setSwapDstAmount(swapOffer.remainingDstAmountSum);
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
            if (swapOffer.readableStatus === 'FILLED') {
                setSwapSrcAmount(swapOffer.srcAmount);
                setSwapDstAmount(swapOffer.dstAmount);
            } else if (swapDstAmount.gte(swapOffer.remainingDstAmountSum)) {
                setSwapSrcAmount(swapOffer.remainingDstAmountSum.eq(swapOffer.dstAmount) ? swapOffer.srcAmount : swapOffer.calculateSrcAmountFromDstAmount(swapOffer.remainingDstAmountSum));
                setSwapDstAmount(swapOffer.remainingDstAmountSum);
            } else {
                setSwapSrcAmount(swapOffer.calculateSrcAmountFromDstAmount(swapDstAmount));
            }
        }
    }, [swapDstAmount]);

    const handleCreateSwapForOffer = async () => {
        if (tokenApproved) {
            try {
                startTransaction(`Please go to your wallet and confirm the transaction for taking the swap.`);

                try {
                    const receipt = await createSwapForOffer(contractAddresses[network].SwappyManager, hash, swapOffer.dstToken.networkSpecificAddress[network], swapDstAmount, swapOffer.feeAmount);

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
                const receipt = await approveToken(swapOffer.dstTokenAddress, contractAddresses[network].SwappyManager);

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
                const receipt = await cancelSwapOffer(contractAddresses[network].SwappyManager, hash);

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
        return <MainContentContainer sx={{ width: '100%' }}>Loading...</MainContentContainer>;
    }

    return (
        <>
            <MainContentContainer sx={{ width: '100%' }}>
                {swapOffer.partialFillEnabled && swapOffer.readableStatus !== 'FILLED' && <SwapOfferDetailsPartialFillTokenForm token={swapOffer.dstToken} amount={swapDstAmount} maxAmount={swapOffer.remainingDstAmountSum} setAmount={setSwapDstAmount} tokenDecimals={swapOffer.dstTokenDecimals} labelText='You send' sx={{ width: '100%' }} />}
                {(!swapOffer.partialFillEnabled || swapOffer.readableStatus === 'FILLED') && <SwapOfferDetailsTokenInfo token={swapOffer.dstToken} amount={swapOffer.dstAmountInBaseUnit} labelText='You send' />}

                <Grid item xs={12} justifyContent='center' alignItems='center' sx={{ padding: '0 !important' }}>
                    <IconButton variant='outlined' disabled>
                        <ArrowDownwardIcon />
                    </IconButton>
                </Grid>

                <SwapOfferDetailsTokenInfo token={swapOffer.srcToken} amount={ethers.utils.formatUnits(swapSrcAmount.toString(), swapOffer.srcTokenDecimals)} labelText='You receive' />

                <Grid item sx={{ height: '42px' }} />

                <BorderSection title='Swap offer details'>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', paddingBottom: '8px', marginBottom: '8px', marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                        <Grid item xs={4} textAlign='right'>
                            <StyledBox>
                                <SwapStatusChip status={swapOffer.readableStatus} />
                            </StyledBox>
                        </Grid>
                        <Grid item xs={8} textAlign='center'>
                            <StyledBox>
                                <SwapOfferPercentageFilledLabel percentage={swapOffer.filledPercentage} />
                            </StyledBox>
                        </Grid>
                    </Box>
                    <Grid container direction='row' alignItems='flex-start' sx={{ padding: '0.5em' }}>
                        <Grid item xs={4} textAlign='right'>
                            <StyledBox>
                                <StyledAttributeKey>Created at:</StyledAttributeKey>
                            </StyledBox>
                            <StyledBox>
                                <StyledAttributeKey>Created by:</StyledAttributeKey>
                            </StyledBox>
                            <StyledBox>
                                <StyledAttributeKey>Offer:</StyledAttributeKey>
                            </StyledBox>
                            <StyledBox>
                                <StyledAttributeKey>For:</StyledAttributeKey>
                            </StyledBox>
                            <StyledBox>
                                <StyledAttributeKey>{isMobile ? 'Fee:' : "Swappy's fee:"}</StyledAttributeKey>
                            </StyledBox>
                            {swapOffer.displayExpirationTime && (
                                <StyledBox>
                                    <StyledAttributeKey>Expires:</StyledAttributeKey>
                                </StyledBox>
                            )}
                            {swapOffer.dstAddress !== ethers.constants.AddressZero && (
                                <StyledBox>
                                    <StyledAttributeKey>{isMobile ? 'Private:' : 'Private swap for:'}</StyledAttributeKey>
                                </StyledBox>
                            )}
                            <StyledBox>
                                <StyledAttributeKey>Rate:</StyledAttributeKey>
                            </StyledBox>
                        </Grid>
                        <StyledInfoValues item xs={8} textAlign='left'>
                            <StyledBox>
                                <Typography>{swapOffer.displayCreatedTime}</Typography>
                            </StyledBox>
                            <StyledBox>
                                <Tooltip title={swapOffer.srcAddress}>
                                    <Typography>{sliceAddress(swapOffer.srcAddress)}</Typography>
                                </Tooltip>
                            </StyledBox>
                            <StyledBox>
                                <StyledTypography>
                                    <Tooltip title={swapOffer.srcAmountInBaseUnit}>
                                        <Truncate>{swapOffer.srcAmountInBaseUnit}</Truncate>
                                    </Tooltip>
                                    {swapOffer.srcTokenName}
                                </StyledTypography>
                            </StyledBox>
                            <StyledBox>
                                <StyledTypography>
                                    <Tooltip title={swapOffer.dstAmountInBaseUnit}>
                                        <Truncate>{swapOffer.dstAmountInBaseUnit}</Truncate>
                                    </Tooltip>
                                    {swapOffer.dstTokenName}
                                </StyledTypography>
                            </StyledBox>
                            <StyledBox>
                                <StyledTypography>
                                    <Tooltip title={swapOffer.feeAmountInBaseUnit}>
                                        <Truncate>{swapOffer.feeAmountInBaseUnit}</Truncate>
                                    </Tooltip>
                                    {networks[network].nativeCurrency.symbol}
                                </StyledTypography>
                            </StyledBox>
                            {swapOffer.displayExpirationTime && (
                                <StyledBox>
                                    <Typography>{swapOffer.displayExpirationTime ? swapOffer.displayExpirationTime : 'not defined'}</Typography>
                                </StyledBox>
                            )}
                            {swapOffer.dstAddress !== ethers.constants.AddressZero && (
                                <StyledBox>
                                    <Typography>{sliceAddress(swapOffer.dstAddress)}</Typography>
                                </StyledBox>
                            )}
                            <StyledBox>
                                <StyledExchangeRate>
                                    <StyledTypography>1 {swapOffer.dstTokenName} =</StyledTypography>
                                    <StyledAmountAndToken>
                                        <Tooltip title={swapOffer.displayExchangeRateSrcDst}>
                                            <Truncate>{swapOffer.displayExchangeRateSrcDst}</Truncate>
                                        </Tooltip>
                                        {swapOffer.srcTokenName}
                                    </StyledAmountAndToken>
                                </StyledExchangeRate>
                            </StyledBox>
                        </StyledInfoValues>
                    </Grid>
                </BorderSection>

                <Grid item sx={{ height: '22px' }} />

                {swapOffer.swaps.length !== 0 && (
                    <BorderSection title='Swaps'>
                        <StyledTableContainer component={Paper}>
                            <StyledTable aria-label='simple table'>
                                <StyledTableHead>
                                    <TableRow>
                                        {!isMobile && <StyledHeaderTableCell>Time</StyledHeaderTableCell>}
                                        <StyledHeaderTableCell>User</StyledHeaderTableCell>
                                        <StyledHeaderTableCell>User sent</StyledHeaderTableCell>
                                        <StyledHeaderTableCell>User received</StyledHeaderTableCell>
                                    </TableRow>
                                </StyledTableHead>
                                <TableBody>
                                    {swapOffer.swaps.map((swap, index) => {
                                        return (
                                            <StyledTableRow key={index}>
                                                {!isMobile && <StyledTableCell align='right'>{swap.displayClosedTime}</StyledTableCell>}
                                                <StyledTableCell align='right'>
                                                    <Tooltip title={swap.dstAddress}>
                                                        <Truncate>{swap.displayDstAddress}</Truncate>
                                                    </Tooltip>
                                                </StyledTableCell>
                                                <StyledTableCell align='right'>
                                                    <Tooltip title={swap.dstAmountInBaseUnit}>
                                                        <Truncate>{swap.dstAmountInBaseUnit}</Truncate>
                                                    </Tooltip>
                                                    {swapOffer.dstTokenName}
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <Tooltip title={swap.srcAmountInBaseUnit}>
                                                        <Truncate>{swap.srcAmountInBaseUnit}</Truncate>
                                                    </Tooltip>
                                                    {swapOffer.srcTokenName}
                                                </StyledTableCell>
                                            </StyledTableRow>
                                        );
                                    })}
                                </TableBody>
                            </StyledTable>
                        </StyledTableContainer>
                    </BorderSection>
                )}

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
