import React, { useState } from 'react';
import { Grid, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import SelectCoinModal from './SelectCoinModal';
import SelectCoin from './SelectCoin';
import ethMainnetTokens from '../data/ethMainnetTokens.json';
import { getCoinImageUrl, getTokenByName } from '../utils/tokens';
import { getAllowance } from '../utils/web3';
import { useAccount } from '../context/AccountContext';
import { useWalletConnect } from '../hooks/useWalletConnect';

const contractAddresses = require('../contracts/contract-address.json');

function Swap() {
    const { defaultAccount, connectWallet } = useWalletConnect();
    const [srcAmount, setSrcAmount] = useState('0.0');
    const [dstAmount, setDstAmount] = useState('0.0');
    const [selectedSrcCoin, setSelectedSrcCoin] = useState(getTokenByName('eth'));
    const [selectedDstCoin, setSelectedDstCoin] = useState(getTokenByName('usdc'));
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

    // React.useEffect(() => {
    //     setWalletConnected(defaultAccount !== null);
    // }, [defaultAccount]);

    const handleCoinSelection = async (coin, type) => {
        if (type === 'src') {
            if (coin === selectedSrcCoin) {
                return;
            }

            const allowance = await getAllowance(coin['address'], defaultAccount, contractAddresses['SwapManager']);

            setTokenApproved(allowance > 0);

            setSelectedSrcCoin(coin);
        } else if (type === 'dst') {
            setSelectedDstCoin(coin);
        }
    };

    let swapButtonText = 'Connect Wallet';
    if (defaultAccount) {
        if (!tokenApproved) {
            swapButtonText = `Approve ${selectedSrcCoin.name} Token`;
        } else {
            swapButtonText = 'Swap';
        }
    }

    const handleButtonClick = async () => {
        if (!defaultAccount) {
            connectWallet();
        } else if (!tokenApproved) {
            // Approve token functionality here
        } else {
            // Swap functionality here
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
                    <Button onClick={handleButtonClick} variant='outlined' sx={{ color: 'white', backgroundColor: '#f3663a' }}>
                        {swapButtonText}
                    </Button>
                </Grid>
            </Grid>

            <SelectCoinModal open={modalOpen} onClose={closeModal} coins={ethMainnetTokens} handleCoinSelection={(coin) => handleCoinSelection(coin, modalType)} />
        </>
    );
}

export default Swap;
