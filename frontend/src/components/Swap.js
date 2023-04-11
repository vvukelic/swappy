import React, { useState } from 'react';
import { CardContent, Grid, Typography } from '@mui/material';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TokenButton from './TokenButton';
import SelectCoinModal from './SelectCoinModal';
import ethMainnetTokens from '../data/ethMainnetTokens.json';
import { getCoinImageUrl, getTokenByName } from '../utils/tokens';

function Swap() {
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
                <Grid item xs={12}>
                    <Card>
                        <CardContent
                            sx={{
                                backgroundColor: '#1f273a',
                                height: 60,
                            }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={2}>
                                    <TokenButton text={selectedSrcCoin ? selectedSrcCoin.name.toUpperCase() : ''} imageSrc={selectedSrcCoinImg} onClick={() => openModal('src')}></TokenButton>
                                </Grid>
                                <Grid item xs={10}>
                                    <Typography variant='h5' sx={{ color: 'white', textAlign: 'right' }}>
                                        0.000000
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card>
                        <CardContent
                            sx={{
                                backgroundColor: '#1f273a',
                                height: 60,
                            }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={2}>
                                    <TokenButton text={selectedDstCoin ? selectedDstCoin.name.toUpperCase() : ''} imageSrc={selectedDstCoinImg} onClick={() => openModal('dst')}></TokenButton>
                                </Grid>
                                <Grid item xs={10}>
                                    <Typography variant='h5' sx={{ color: 'white', textAlign: 'right' }}>
                                        0.000000
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Button variant='outlined' sx={{ color: 'white', backgroundColor: '#f3663a' }}>
                        Swap
                    </Button>
                </Grid>
            </Grid>
            <SelectCoinModal open={modalOpen} onClose={closeModal} coins={ethMainnetTokens} handleCoinSelection={(coin) => handleCoinSelection(coin, modalType)} />
        </>
    );
}

export default Swap;
