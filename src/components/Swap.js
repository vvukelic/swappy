import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Grid, Typography, TextField, FormControlLabel, Checkbox } from '@mui/material';
import Button from '@mui/material/Button';
import SelectCoinModal from './SelectCoinModal';
import SelectCoin from './SelectCoin';
import ethMainnetTokens from '../data/ethMainnetTokens.json';
import { getTokenByName } from '../utils/tokens';
import { getAllowance, approveToken, createSwap } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { toSmallestUnit } from '../utils/general';

const contractAddresses = require('../contracts/contract-address.json');

function Swap({ srcAmount, setSrcAmount, dstAmount, setDstAmount, dstAddress, setDstAddress, selectedSrcCoin, setSelectedSrcCoin, selectedDstCoin, setSelectedDstCoin, swapButtonText, setSwapButtonText, tokenApproved, setTokenApproved, expiresInHours, setExpiresInHours, expiresInMinutes, setExpiresInMinutes, expirationEnabled, setExpirationEnabled, selectedSrcCoinImg, selectedDstCoinImg }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);

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
                setSwapButtonText('Swap');
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

    return (
        <>
            <Grid
                container
                spacing={2}
                sx={{
                    textAlign: 'center',
                    maxWidth: 450,
                    backgroundColor: '#358A9F',
                    margin: 'auto',
                    borderRadius: 8,
                    padding: 2,
                }}
            >
                <SelectCoin selectedCoin={selectedSrcCoin} amount={srcAmount} setAmount={setSrcAmount} selectedCoinImg={selectedSrcCoinImg} type='src' openModal={openModal}></SelectCoin>

                <SelectCoin selectedCoin={selectedDstCoin} amount={dstAmount} setAmount={setDstAmount} selectedCoinImg={selectedDstCoinImg} type='dst' openModal={openModal}></SelectCoin>

                <Grid item xs={12} container alignItems='center' sx={{ color: 'white', padding: '0 16px' }}>
                    <Grid item xs={4}>
                        <FormControlLabel control={<Checkbox color='primary' onChange={() => setExpirationEnabled(!expirationEnabled)} checked={expirationEnabled} />} label='Expires In:' sx={{ color: 'white' }} />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField label='Hours' variant='outlined' type='number' value={expiresInHours} onChange={(e) => setExpiresInHours(e.target.value)} fullWidth disabled={!expirationEnabled} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField label='Minutes' variant='outlined' type='number' value={expiresInMinutes} onChange={(e) => setExpiresInMinutes(e.target.value)} fullWidth disabled={!expirationEnabled} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ color: 'white', padding: '0 16px' }}>
                    <TextField label='Destination Address (Optional)' variant='outlined' onChange={(e) => setDstAddress(e.target.value)} fullWidth InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                </Grid>

                <Grid item xs={12}>
                    <Button onClick={handleSwapButtonClick} variant='outlined' sx={{ color: 'white', backgroundColor: '#f3663a' }}>
                        {swapButtonText}
                    </Button>
                </Grid>
            </Grid>

            <SelectCoinModal open={modalOpen} onClose={closeModal} coins={ethMainnetTokens} handleCoinSelection={(coin) => handleCoinSelection(coin, modalType)} />
        </>
    );
}

export default Swap;
