import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Grid, Typography, Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import styled from '@emotion/styled';
import { takeSwap, cancelSwap, approveToken, getEthBalance, getAllowance } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import MainContentContainer from './MainContentContainer';
import BorderSection from './BorderSection';
import SwapDetailsTokenInfo from './SwapDetailsTokenInfo';
import { getSwap, sliceAddress } from '../utils/general';
import PrimaryButton from './PrimaryButton';
import useTransactionModal from '../hooks/useTransactionModal';
import TransactionStatusModal from './TransactionStatusModal';
import SwapStatusChip from './SwapStatusChip';


const contractAddresses = require('../contracts/contract-address.json');

const StyledBox = styled(Box)`
    min-height: 2.5em;
`;

function SwapDetails({ hash }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const { txModalOpen, setTxModalOpen, txStatus, txStatusTxt, txErrorTxt, startTransaction, endTransaction } = useTransactionModal();
    const [swap, setSwap] = useState(null);
    const [tokenApproved, setTokenApproved] = useState(false);
    const [swapButtonText, setSwapButtonText] = useState('Connect wallet');

    useEffect(() => {
        async function checkTokenApproved() {
            let tokenBalance = null;

            if (swap.dstTokenAddress === ethers.constants.AddressZero) {
                tokenBalance = await getEthBalance(defaultAccount);
                setTokenApproved(tokenBalance > 0);
            } else {
                tokenBalance = await getAllowance(swap.dstTokenAddress, defaultAccount, contractAddresses.SwapManager[network]);
                setTokenApproved(tokenBalance > 0);
            }
        }

        if (swap) {
            checkTokenApproved();
        }
    }, [defaultAccount, network, swap]);

    useEffect(() => {
        if (defaultAccount && swap) {
            if (tokenApproved) {
                setSwapButtonText('Take swap');
            } else {
                if (swap.dstTokenAddress === ethers.constants.AddressZero) {
                    setSwapButtonText('ETH balance too low');
                } else {
                    setSwapButtonText(`Approve ${swap.dstTokenName} Token`);
                }
            }
        }
    }, [defaultAccount, swap, tokenApproved]);

    useEffect(() => {
        async function getSwapDetails() {
            try {
                const swap = await getSwap(contractAddresses.SwapManager[network], hash, network);
                setSwap(swap);
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
                startTransaction(`Please go to your wallet and confirm the transaction for taking the swap.`);

                try {
                    const receipt = await takeSwap(contractAddresses.SwapManager[network], hash, swap.dstToken.networkSpecificAddress[network], swap.dstAmount, swap.feeAmount);

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
            startTransaction(`Please go to your wallet and approve ${swap.dstTokenName}`);

            try {
                const receipt = await approveToken(swap.dstTokenAddress, contractAddresses.SwapManager[network]);

                if (receipt.status === 1) {
                    endTransaction(true, `You successfuly approved ${swap.dstTokenName}!`);
                    setTokenApproved(true);
                } else {
                    endTransaction(false, `There was an error approving ${swap.dstTokenName}.`);
                }
            } catch (error) {
                endTransaction(false, `There was an error approving ${swap.dstTokenName}.`, error.toString());
                return;
            }
        }
    };

    const handleCancelSwap = async () => {
        try {
            startTransaction(`Please go to your wallet and confirm the transaction for canceling the swap.`);

            try {
                const receipt = await cancelSwap(contractAddresses.SwapManager[network], hash);

                if (receipt.status === 1) {
                    endTransaction(true, `Swap canceled successfully!`);
                    console.log('Swap canceled successfully!');
                } else {
                    endTransaction(false, `Failed to cancel the swap.`);
                    console.error('Failed to cancel the swap.');
                }
            } catch (error) {
                endTransaction(false, 'Failed to cancel the swap.', error.toString());
                return;
            }

            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    if (!swap) {
        return <div>Loading...</div>;
    }

    return (
        <>
        <MainContentContainer sx={{ width: '100%' }}>
            <SwapDetailsTokenInfo token={swap.dstToken} amount={swap.dstAmountInBaseUnit.toString()} labelText='You send' sx={{ width: '100%' }} />

            <Grid item xs={12} justifyContent='center' alignItems='center' sx={{ padding: '0 !important' }}>
                <IconButton variant='outlined' disabled>
                    <ArrowDownwardIcon />
                </IconButton>
            </Grid>

            <SwapDetailsTokenInfo token={swap.srcToken} amount={swap.srcAmountInBaseUnit.toString()} labelText='You receive' />

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
                            <SwapStatusChip status={swap.readableStatus} />
                        </StyledBox>
                        <StyledBox>
                            <Typography>{swap.feeAmountInBaseUnit} ETH</Typography>
                        </StyledBox>
                        <StyledBox>
                            <Typography>{swap.displayExpirationTime ? swap.displayExpirationTime : 'not defined'}</Typography>
                        </StyledBox>
                        <StyledBox>
                            <Typography>{sliceAddress(swap.dstAddress)}</Typography>
                        </StyledBox>
                    </Grid>
                </Grid>
            </BorderSection>

            {swap.readableStatus === 'OPENED' && (swap.dstAddress === ethers.constants.AddressZero || swap.dstAddress === defaultAccount) && swap.srcAddress !== defaultAccount && (
                <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                    <PrimaryButton onClick={handleTakeSwap} buttonText={swapButtonText} />
                </Grid>
            )}

            {swap.readableStatus === 'OPENED'  && swap.srcAddress === defaultAccount && (
                <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                    <PrimaryButton onClick={handleCancelSwap} buttonText='Cancel' />
                </Grid>
            )}
        </MainContentContainer>
        <TransactionStatusModal
            open={txModalOpen}
            status={txStatus}
            statusTxt={txStatusTxt}
            errorTxt={txErrorTxt}
            onClose={() => setTxModalOpen(false)}
        />
        </>
    );
}

export default SwapDetails;
