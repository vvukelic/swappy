import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SelectTokenModal from './SelectTokenModal';
import SelectToken from './SelectToken';
import MainContentContainer from './MainContentContainer';
import { getTokenByName } from '../utils/tokens';
import { getAllowance, approveToken, createSwap } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { toSmallestUnit } from '../utils/general';
import styled from '@emotion/styled';
import PrimaryButton from './PrimaryButton';
import useTransactionModal from '../hooks/useTransactionModal';
import TransactionStatusModal from './TransactionStatusModal';


const contractAddresses = require('../contracts/contract-address.json');

function Swap({ srcAmount, setSrcAmount, dstAmount, setDstAmount, dstAddress, setDstAddress, selectedSrcToken, setSelectedSrcToken, selectedDstToken, setSelectedDstToken, swapButtonText, setSwapButtonText, tokenApproved, setTokenApproved, expiresInHours, setExpiresInHours, expiresInMinutes, setExpiresInMinutes, expirationEnabled, setExpirationEnabled, selectedSrcTokenImg, selectedDstTokenImg }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const { txModalOpen, setTxModalOpen, txStatus, txStatusTxt, txErrorTxt, startTransaction, endTransaction } = useTransactionModal();

    const StyledSwitch = styled(Switch)`
        & .MuiSwitch-switchBase.Mui-checked {
            color: white;
            &:hover {
                background-color: rgba(255, 255, 255, 0.08);
            }
        }
        & .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
            background-color: white;
        }
    `;

    const openModal = (type) => {
        setModalType(type);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalType(null);
        setModalOpen(false);
    };

    const handleTokenSelection = async (token, type) => {
        if (type === 'src') {
            if (token === selectedSrcToken) {
                return;
            }

            let tokenAddress = token.networkSpecificAddress[network];
            if (tokenAddress === ethers.constants.AddressZero) {
                tokenAddress = getTokenByName('WETH').networkSpecificAddress[network];
            }

            const availableTokenBalance = await getAllowance(tokenAddress, defaultAccount, contractAddresses.SwapManager[network]);
            setTokenApproved(availableTokenBalance > 0);

            setSelectedSrcToken(token);
        } else if (type === 'dst') {
            setSelectedDstToken(token);
        }
    };

    useEffect(() => {
        if (!selectedSrcToken) {
            handleTokenSelection(getTokenByName('ETH'), 'src');
        }

        if (!selectedDstToken) {
            handleTokenSelection(getTokenByName('USDC'), 'dst');
        }
    }, [defaultAccount]);

    useEffect(() => {
        if (defaultAccount) {
            if (tokenApproved) {
                setSwapButtonText('Create Swap');
            } else {
                setSwapButtonText(`Approve ${selectedSrcToken.name} Token`);
            }
        }
    }, [selectedSrcToken, tokenApproved]);

    const handleSwapButtonClick = async () => {
        if (!defaultAccount) {
            connectWallet();
        } else if (!tokenApproved) {
            let tokenAddress = selectedSrcToken.networkSpecificAddress[network];

            if (tokenAddress === ethers.constants.AddressZero) {
                tokenAddress = getTokenByName('WETH').networkSpecificAddress[network];
            }

            startTransaction(`Please go to your wallet and approve ${selectedSrcToken.name.toUpperCase()}.`);

            try {
                const receipt = await approveToken(tokenAddress, contractAddresses.SwapManager[network]);

                if (receipt.status === 1) {
                    endTransaction(true, `You successfuly approved ${selectedSrcToken.name.toUpperCase()}!`);
                    setTokenApproved(true);
                } else {
                    endTransaction(false, `There was an error approving ${selectedSrcToken.name.toUpperCase()}.`);
                }
            } catch (error) {
                endTransaction(false, `There was an error approving ${selectedSrcToken.name.toUpperCase()}.`, error.toString());
                return;
            }
        } else {
            const srcAmountInt = await toSmallestUnit(srcAmount, selectedSrcToken.networkSpecificAddress[network]);
            const dstAmountInt = await toSmallestUnit(dstAmount, selectedDstToken.networkSpecificAddress[network]);

            let expiresIn = 0;
            if (expirationEnabled) {
                expiresIn = parseInt(expiresInHours) * 60 * 60 + parseInt(expiresInMinutes) * 60;
            }

            let _dstAddress = dstAddress;
            if (!_dstAddress) {
                _dstAddress = ethers.constants.AddressZero;
            }

            startTransaction(`Please go to your wallet and confirm the transaction for the swap.`);

            try {
                const receipt = await createSwap(contractAddresses.SwapManager[network], selectedSrcToken.networkSpecificAddress[network], srcAmountInt, selectedDstToken.networkSpecificAddress[network], dstAmountInt, dstAddress, expiresIn);
                
                if (receipt.status === 1) {
                    const swapCreatedEvent = receipt.events?.find((e) => e.event === 'SwapCreated');

                    if (swapCreatedEvent) {
                        const swapHash = swapCreatedEvent.args[1];
                        window.location.href = `/swap/${swapHash}`;
                        endTransaction(true, `You successfuly created a swap!`);
                    } else {
                        endTransaction(false, `Transaction for creating a swap failed.`);
                        console.error("Couldn't find SwapCreated event in transaction receipt");
                    }
                } else {
                    endTransaction(false, `Transaction for creating a swap failed.`);
                }
            } catch (error) {
                console.error(error);
                endTransaction(false, 'Transaction for creating a swap failed.', error.toString());
                return;
            }
        }
    };

    const handleSwitchTokensButtonClick = async () => {
        // Swap tokens
        const tempToken = selectedSrcToken;
        setSelectedSrcToken(selectedDstToken);
        setSelectedDstToken(tempToken);

        // Swap amounts
        const tempAmount = srcAmount;
        setSrcAmount(dstAmount);
        setDstAmount(tempAmount);

        let newSrcTokenAddress = selectedDstToken.networkSpecificAddress[network];
        if (newSrcTokenAddress === ethers.constants.AddressZero) {
            newSrcTokenAddress = getTokenByName('WETH').networkSpecificAddress[network];
        }

        const availableTokenBalance = await getAllowance(newSrcTokenAddress, defaultAccount, contractAddresses.SwapManager[network]);
        setTokenApproved(availableTokenBalance > 0);
    };

    return (
        <>
            <MainContentContainer>
                <SelectToken selectedToken={selectedSrcToken} amount={srcAmount} setAmount={setSrcAmount} selectedTokenImg={selectedSrcTokenImg} labelText='You send' openModal={() => openModal('src')} />

                <Grid item xs={12} container justifyContent='center' alignItems='center' sx={{ padding: '0 !important' }}>
                    <IconButton
                        variant='outlined'
                        onClick={handleSwitchTokensButtonClick}
                        style={{
                            transition: 'transform 0.3s ease-in-out',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'rotate(180deg)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'rotate(0deg)';
                        }}
                    >
                        <ArrowDownwardIcon />
                    </IconButton>
                </Grid>

                <SelectToken selectedToken={selectedDstToken} amount={dstAmount} setAmount={setDstAmount} selectedTokenImg={selectedDstTokenImg} labelText='You receive' openModal={() => openModal('dst')} />

                <Grid item xs={12} container alignItems='center' sx={{ color: 'white', padding: '0 16px', marginTop: '20px' }}>
                    <Grid item xs={6}>
                        <FormControlLabel control={<StyledSwitch onChange={() => setExpirationEnabled(!expirationEnabled)} checked={expirationEnabled} />} label='Expires In:' sx={{ color: 'white' }} />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label='Hours' variant='outlined' type='number' value={expiresInHours} onChange={(e) => setExpiresInHours(e.target.value)} fullWidth disabled={!expirationEnabled} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label='Minutes' variant='outlined' type='number' value={expiresInMinutes} onChange={(e) => setExpiresInMinutes(e.target.value)} fullWidth disabled={!expirationEnabled} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ color: 'white', padding: '0 16px' }}>
                    <TextField label='Destination Address (Optional)' variant='outlined' onChange={(e) => setDstAddress(e.target.value)} fullWidth InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                </Grid>

                <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                    <PrimaryButton onClick={handleSwapButtonClick} buttonText={swapButtonText} />
                </Grid>
            </MainContentContainer>

            <SelectTokenModal
                open={modalOpen}
                onClose={closeModal}
                handleTokenSelection={(token) => handleTokenSelection(token, modalType)}
                title={modalType === 'src' ? 'Select a token to send': 'Select a token to receive'}
                network={network}
            />

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

export default Swap;
