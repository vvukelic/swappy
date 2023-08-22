import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Grid, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import SelectCoinModal from './SelectCoinModal';
import SelectCoin from './SelectCoin';
import ethMainnetTokens from '../data/ethMainnetTokens.json';
import { getCoinImageUrl, getTokenByName } from '../utils/tokens';
import { getAllowance, approveToken, createSwap, getEthBalance } from '../utils/web3';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { toSmallestUnit } from '../utils/general';
import UserSwapsList from './UserSwapsList';

const contractAddresses = require('../contracts/contract-address.json');

function Swap() {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [srcAmount, setSrcAmount] = useState('0.0');
    const [dstAmount, setDstAmount] = useState('0.0');
    const [selectedSrcCoin, setSelectedSrcCoin] = useState(null);
    const [selectedDstCoin, setSelectedDstCoin] = useState(null);
    const [swapButtonText, setSwapButtonText] = useState('Connect wallet');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [tokenApproved, setTokenApproved] = useState(false);
    const selectedSrcCoinImg = getCoinImageUrl(selectedSrcCoin);
    const selectedDstCoinImg = getCoinImageUrl(selectedDstCoin);

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

            let tokenBalance = null;

            if (coin.address === ethers.constants.AddressZero) {
                tokenBalance = await getEthBalance(defaultAccount);
                setTokenApproved(tokenBalance > 0);
            } else {
                tokenBalance = await getAllowance(coin.address, defaultAccount, contractAddresses.SwapManager[network]);
                setTokenApproved(tokenBalance > 0);
            }

            if (defaultAccount) {
                if (tokenBalance > 0) {
                    setSwapButtonText('Swap');
                } else {
                    if (coin.address === ethers.constants.AddressZero) {
                        setSwapButtonText('ETH balance too low');
                    } else if (selectedSrcCoin) {
                        setSwapButtonText(`Approve ${coin.name} Token`);
                    }
                }
            }

            setSelectedSrcCoin(coin);
        } else if (type === 'dst') {
            setSelectedDstCoin(coin);
        }
    };

    useEffect(() => {
        // Selecting default source and destination coins on component mount
        handleCoinSelection(getTokenByName('eth'), 'src');
        handleCoinSelection(getTokenByName('usdc'), 'dst');
    }, [defaultAccount]);

    const handleSwapButtonClick = async () => {
        if (!defaultAccount) {
            connectWallet();
        } else if (!tokenApproved) {
            const approved = await approveToken(selectedSrcCoin.address, contractAddresses.SwapManager[network]);

            if (approved) {
                setTokenApproved(true);
            } else {
                // Handle error in UI, approval failed
            }
        } else {
            const srcAmountInt = await toSmallestUnit(srcAmount, selectedSrcCoin.address);
            const dstAmountInt = await toSmallestUnit(dstAmount, selectedDstCoin.address);

            const receipt = await createSwap(contractAddresses.SwapManager[network], selectedSrcCoin.address, srcAmountInt, selectedDstCoin.address, dstAmountInt, 0);

            if (receipt.status === 1) {
                const swapCreatedEvent = receipt.events?.find(e => e.event === "SwapCreated");

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
                    backgroundColor: '#2a374e',
                    margin: 'auto',
                    borderRadius: 8,
                    padding: 2,
                    marginTop: 2,
                }}
            >
                <Grid item xs={12}>
                    <Typography variant='h5' sx={{ color: 'white' }}>
                        Swap
                    </Typography>
                </Grid>

                <SelectCoin selectedCoin={selectedSrcCoin} amount={srcAmount} setAmount={setSrcAmount} selectedCoinImg={selectedSrcCoinImg} type='src' openModal={openModal}></SelectCoin>

                <SelectCoin selectedCoin={selectedDstCoin} amount={dstAmount} setAmount={setDstAmount} selectedCoinImg={selectedDstCoinImg} type='dst' openModal={openModal}></SelectCoin>

                <Grid item xs={12}>
                    <Button onClick={handleSwapButtonClick} variant='outlined' sx={{ color: 'white', backgroundColor: '#f3663a' }}>
                        {swapButtonText}
                    </Button>
                </Grid>
            </Grid>

            {defaultAccount && <UserSwapsList userAddress={defaultAccount} network={network} />}

            <SelectCoinModal open={modalOpen} onClose={closeModal} coins={ethMainnetTokens} handleCoinSelection={(coin) => handleCoinSelection(coin, modalType)} />
        </>
    );
}

export default Swap;
