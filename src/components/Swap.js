import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SelectCoinModal from './SelectCoinModal';
import SelectCoin from './SelectCoin';
import MainContentContainer from './MainContentContainer';
import ethMainnetTokens from '../data/ethMainnetTokens.json';
import { getTokenByName } from '../utils/tokens';
import { getAllowance, approveToken, createSwap } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { toSmallestUnit } from '../utils/general';
import styled from '@emotion/styled';
import PrimaryButton from './PrimaryButton';


const contractAddresses = require('../contracts/contract-address.json');

function Swap({ srcAmount, setSrcAmount, dstAmount, setDstAmount, dstAddress, setDstAddress, selectedSrcCoin, setSelectedSrcCoin, selectedDstCoin, setSelectedDstCoin, swapButtonText, setSwapButtonText, tokenApproved, setTokenApproved, expiresInHours, setExpiresInHours, expiresInMinutes, setExpiresInMinutes, expirationEnabled, setExpirationEnabled, selectedSrcCoinImg, selectedDstCoinImg }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);

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

    const handleCoinSelection = async (coin, type) => {
        if (type === 'src') {
            if (coin === selectedSrcCoin) {
                return;
            }

            let coinAddress = coin.address;
            if (coinAddress === ethers.constants.AddressZero) {
                coinAddress = getTokenByName('weth').address;
            }

            const availableTokenBalance = await getAllowance(coinAddress, defaultAccount, contractAddresses.SwapManager[network]);
            setTokenApproved(availableTokenBalance > 0);

            setSelectedSrcCoin(coin);
        } else if (type === 'dst') {
            setSelectedDstCoin(coin);
        }
    };

    useEffect(() => {
        if (!selectedSrcCoin) {
            handleCoinSelection(getTokenByName('eth'), 'src');
        }

        if (!selectedDstCoin) {
            handleCoinSelection(getTokenByName('usdc'), 'dst');
        }
    }, [defaultAccount]);

    useEffect(() => {
        if (defaultAccount) {
            if (tokenApproved) {
                setSwapButtonText('Create Swap');
            } else {
                setSwapButtonText(`Approve ${selectedSrcCoin.name} Token`);
            }
        }
    }, [selectedSrcCoin, tokenApproved]);

    const handleSwapButtonClick = async () => {
        if (!defaultAccount) {
            connectWallet();
        } else if (!tokenApproved) {
            let coinAddress = selectedSrcCoin.address;

            if (coinAddress === ethers.constants.AddressZero) {
                coinAddress = getTokenByName('weth').address;
            }

            const approved = await approveToken(coinAddress, contractAddresses.SwapManager[network]);

            if (approved) {
                setTokenApproved(true);
            } else {
                // Handle error in UI, approval failed
            }
        } else {
            const srcAmountInt = await toSmallestUnit(srcAmount, selectedSrcCoin.address);
            const dstAmountInt = await toSmallestUnit(dstAmount, selectedDstCoin.address);

            let expiresIn = 0;
            if (expirationEnabled) {
                expiresIn = parseInt(expiresInHours) * 60 * 60 + parseInt(expiresInMinutes) * 60;
            }

            let _dstAddress = dstAddress;
            if (!_dstAddress) {
                _dstAddress = ethers.constants.AddressZero;
            }

            const receipt = await createSwap(contractAddresses.SwapManager[network], selectedSrcCoin.address, srcAmountInt, selectedDstCoin.address, dstAmountInt, dstAddress, expiresIn);

            if (receipt.status === 1) {
                const swapCreatedEvent = receipt.events?.find((e) => e.event === 'SwapCreated');

                if (swapCreatedEvent) {
                    const swapHash = swapCreatedEvent.args[1];
                    window.location.href = `/swap/${swapHash}`;
                } else {
                    console.error("Couldn't find SwapCreated event in transaction receipt");
                }
            } else {
                // The transaction failed
            }
        }
    };

    const handleSwitchCoinsButtonClick = () => {
        // Swap coins
        const tempCoin = selectedSrcCoin;
        setSelectedSrcCoin(selectedDstCoin);
        setSelectedDstCoin(tempCoin);

        // Swap amounts
        const tempAmount = srcAmount;
        setSrcAmount(dstAmount);
        setDstAmount(tempAmount);
    };

    return (
        <>
            <MainContentContainer>
                <SelectCoin selectedCoin={selectedSrcCoin} amount={srcAmount} setAmount={setSrcAmount} selectedCoinImg={selectedSrcCoinImg} labelText='You sell' openModal={() => openModal('src')} />

                <Grid item xs={12} container justifyContent='center' alignItems='center' sx={{ padding: '0 !important' }}>
                    <IconButton
                        variant='outlined'
                        onClick={handleSwitchCoinsButtonClick}
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

                <SelectCoin selectedCoin={selectedDstCoin} amount={dstAmount} setAmount={setDstAmount} selectedCoinImg={selectedDstCoinImg} labelText='You buy' openModal={() => openModal('dst')} />

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

            <SelectCoinModal open={modalOpen} onClose={closeModal} coins={ethMainnetTokens} handleCoinSelection={(coin) => handleCoinSelection(coin, modalType)} />
        </>
    );
}

export default Swap;
