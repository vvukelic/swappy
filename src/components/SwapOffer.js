import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Grid, TextField, FormControlLabel, Switch, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SelectTokenModal from './SelectTokenModal';
import SelectToken from './SelectToken';
import MainContentContainer from './MainContentContainer';
import { getTokenByName, updateCustomTokensList, toSmallestUnit, toBaseUnit, getTokenBalance } from '../utils/tokens';
import { getAllowance, approveToken, createSwapOffer, getTokenDecimals } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import styled from '@emotion/styled';
import PrimaryButton from './PrimaryButton';
import useTransactionModal from '../hooks/useTransactionModal';
import TransactionStatusModal from './TransactionStatusModal';


const contractAddresses = require('../contracts/contract-address.json');

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

function SwapOffer({ 
    srcAmount,
    setSrcAmount,
    dstAmount,
    setDstAmount,
    dstAddress,
    setDstAddress,
    selectedSrcToken,
    setSelectedSrcToken,
    selectedDstToken,
    setSelectedDstToken,
    swapOfferButtonText, 
    setSwapOfferButtonText,
    tokenApproved,
    setTokenApproved,
    expiresInHours,
    setExpiresInHours,
    expiresInMinutes,
    setExpiresInMinutes,
    expirationEnabled,
    setExpirationEnabled,
    partialFillEnabled,
    setPartialFillEnabled,
    selectedSrcTokenImg,
    selectedDstTokenImg
}) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [insufficientSrcTokenAmount, setInsufficientSrcTokenAmount] = useState(false);
    const [defaultAccountSrcTokenBalance, setDefaultAccountSrcTokenBalance] = useState(null);
    const [selectedSrcTokenDecimals, setSelectedSrcTokenDecimals] = useState(0);
    const [selectedDstTokenDecimals, setSelectedDstTokenDecimals] = useState(0);
    const { txModalOpen, setTxModalOpen, txStatus, txStatusTxt, txErrorTxt, startTransaction, endTransaction } = useTransactionModal();

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
        updateCustomTokensList();
    }, []);

    useEffect(() => {
        if (!selectedSrcToken) {
            handleTokenSelection(getTokenByName('ETH'), 'src');
        }

        if (!selectedDstToken) {
            handleTokenSelection(getTokenByName('USDC'), 'dst');
        }
    }, [defaultAccount]);

    useEffect(() => {
        async function swapOfferButtonText() {
            const tokenAddress = selectedSrcToken.networkSpecificAddress[network];
            const defaultAccountSrcTokenBalance = await getTokenBalance(defaultAccount, tokenAddress);

            const srcAmountInt = await toSmallestUnit(srcAmount, tokenAddress);

            if (srcAmountInt.lte(defaultAccountSrcTokenBalance)) {
                setInsufficientSrcTokenAmount(false);

                if (tokenApproved) {
                    setSwapOfferButtonText('Create Swap Offer');
                } else {
                    setSwapOfferButtonText(`Approve ${selectedSrcToken.name} Token`);
                }
            } else {
                setInsufficientSrcTokenAmount(true);
                setSwapOfferButtonText(`Insufficient ${selectedSrcToken.name} balance`);
            }
        }

        if (defaultAccount && selectedSrcToken) {
            swapOfferButtonText();
        }
    }, [network, selectedSrcToken, tokenApproved, srcAmount]);

    useEffect(() => {
        async function srcTokenHoldingsAmount() {
            const tokenContract = selectedSrcToken.networkSpecificAddress[network];
            const tokenBalance = await getTokenBalance(defaultAccount, tokenContract);
            setDefaultAccountSrcTokenBalance(await toBaseUnit(tokenBalance, tokenContract));
        }

        async function getSrcTokenDecimals() {
            const tokenAddress = selectedSrcToken.networkSpecificAddress[network];
            const srcTokenDecimals = tokenAddress === ethers.constants.AddressZero ? 18 : await getTokenDecimals(tokenAddress);
            setSelectedSrcTokenDecimals(srcTokenDecimals);
        }

        if (defaultAccount && selectedSrcToken) {
            srcTokenHoldingsAmount();
            getSrcTokenDecimals();
        }
    }, [network, selectedSrcToken]);

    useEffect(() => {
        async function getDstTokenDecimals() {
            const tokenAddress = selectedDstToken.networkSpecificAddress[network];
            const dstTokenDecimals = tokenAddress === ethers.constants.AddressZero ? 18 : await getTokenDecimals(tokenAddress);
            setSelectedDstTokenDecimals(dstTokenDecimals);
        }

        if (defaultAccount && selectedDstToken) {
            getDstTokenDecimals();
        }
    }, [network, selectedDstToken]);

    const handleSwapOfferButtonClick = async () => {
        if (!defaultAccount) {
            connectWallet();
        } else if (!tokenApproved && !insufficientSrcTokenAmount) {
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
        } else if (!insufficientSrcTokenAmount) {
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
                const receipt = await createSwapOffer(
                    contractAddresses.SwapManager[network],
                    selectedSrcToken.networkSpecificAddress[network],
                    srcAmountInt,
                    selectedDstToken.networkSpecificAddress[network],
                    dstAmountInt,
                    dstAddress,
                    expiresIn,
                    partialFillEnabled
                );
                
                if (receipt.status === 1) {
                    const swapOfferCreatedEvent = receipt.events?.find((e) => e.event === 'SwapOfferCreated');

                    if (swapOfferCreatedEvent) {
                        const swapOfferHash = swapOfferCreatedEvent.args[1];
                        window.location.href = `/swap/${swapOfferHash}`;
                        endTransaction(true, `You successfuly created a swap offer!`);
                    } else {
                        endTransaction(false, `Transaction for creating a swap offer failed.`);
                        console.error("Couldn't find SwapCreated event in transaction receipt");
                    }
                } else {
                    endTransaction(false, `Transaction for creating a swap offer failed.`);
                }
            } catch (error) {
                console.error(error);
                endTransaction(false, 'Transaction for creating a swap offer failed.', error.toString());
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
                <SelectToken selectedToken={selectedSrcToken} selectedTokenDecimals={selectedSrcTokenDecimals} amount={srcAmount} setAmount={setSrcAmount} selectedTokenImg={selectedSrcTokenImg} labelText='You send' openModal={() => openModal('src')} selectedTokenAccountBalance={defaultAccountSrcTokenBalance} />

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

                <SelectToken selectedToken={selectedDstToken} selectedTokenDecimals={selectedDstTokenDecimals} amount={dstAmount} setAmount={setDstAmount} selectedTokenImg={selectedDstTokenImg} labelText='You receive' openModal={() => openModal('dst')} />

                <Grid item xs={12} container alignItems='center' sx={{ color: 'white', padding: '0 16px', marginTop: '20px' }}>
                    <Grid item xs={6} sm={4}>
                        <FormControlLabel control={<StyledSwitch onChange={() => setExpirationEnabled(!expirationEnabled)} checked={expirationEnabled} />} label='Expires In:' sx={{ color: 'white' }} />
                    </Grid>
                    <Grid item xs={3} sm={4}>
                        <TextField label='Hours' variant='outlined' type='number' value={expiresInHours} onChange={(e) => setExpiresInHours(e.target.value)} fullWidth disabled={!expirationEnabled} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                    </Grid>
                    <Grid item xs={3} sm={4}>
                        <TextField label='Minutes' variant='outlined' type='number' value={expiresInMinutes} onChange={(e) => setExpiresInMinutes(e.target.value)} fullWidth disabled={!expirationEnabled} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ color: 'white', padding: '0 16px' }}>
                    <TextField label='Destination Address (Optional)' variant='outlined' onChange={(e) => setDstAddress(e.target.value)} fullWidth InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                </Grid>

                <Grid item xs={12} container alignItems='center' sx={{ color: 'white', padding: '0 16px' }}>
                    <Grid item xs={12}>
                        <Tooltip title='Enable this option to allow others to partially fulfill your swap offer. This increases the chances of your offer being used, but you may receive multiple smaller transactions instead of a single one.'>
                            <FormControlLabel control={<StyledSwitch onChange={() => setPartialFillEnabled(!partialFillEnabled)} checked={partialFillEnabled} />} label='Allow swap offer to be partially filled' sx={{ color: 'white' }} />
                        </Tooltip>
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                    <PrimaryButton onClick={handleSwapOfferButtonClick} buttonText={swapOfferButtonText} />
                </Grid>
            </MainContentContainer>

            <SelectTokenModal open={modalOpen} onClose={closeModal} handleTokenSelection={(token) => handleTokenSelection(token, modalType)} title={modalType === 'src' ? 'Select a token to send' : 'Select a token to receive'} network={network} />

            <TransactionStatusModal open={txModalOpen} status={txStatus} statusTxt={txStatusTxt} errorTxt={txErrorTxt} onClose={() => setTxModalOpen(false)} />
        </>
    );
}

export default SwapOffer;
