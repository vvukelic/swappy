import React, { useState } from 'react';
import { CardContent, Grid, Typography, TextField } from '@mui/material';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TokenButton from './TokenButton';
import SelectCoinModal from './SelectCoinModal';
import SelectCoin from './SelectCoin';
import ethMainnetTokens from '../data/ethMainnetTokens.json';
import { getCoinImageUrl, getTokenByName } from '../utils/tokens';

function Swap() {
    const [srcAmount, setSrcAmount] = useState('0.0');
    const [dstAmount, setDstAmount] = useState('0.0');
    const [selectedSrcCoin, setSelectedSrcCoin] = useState(getTokenByName('eth'));
    const [selectedDstCoin, setSelectedDstCoin] = useState(getTokenByName('usdc'));
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
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

    const handleCoinSelection = (coin, type) => {
        if (type === 'src') {
            setSelectedSrcCoin(coin);
        } else if (type === 'dst') {
            setSelectedDstCoin(coin);
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

                <SelectCoin
                    selectedCoin={selectedSrcCoin}
                    amount={srcAmount}
                    setAmount={setSrcAmount}
                    selectedCoinImg={selectedSrcCoinImg}
                    type='src'
                    openModal={openModal}
                ></SelectCoin>

                <SelectCoin
                    selectedCoin={selectedDstCoin}
                    amount={dstAmount}
                    setAmount={setDstAmount}
                    selectedCoinImg={selectedDstCoinImg}
                    type='dst'
                    openModal={openModal}
                ></SelectCoin>

                <Grid item xs={12}>
                    <Button variant='outlined' sx={{ color: 'white', backgroundColor: '#f3663a' }}>
                        Swap
                    </Button>
                </Grid>
            </Grid>
            
            <SelectCoinModal
                open={modalOpen}
                onClose={closeModal}
                coins={ethMainnetTokens}
                handleCoinSelection={(coin) => handleCoinSelection(coin, modalType)}
            />
        </>
    );
}

export default Swap;
