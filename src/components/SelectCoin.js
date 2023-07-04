import React from 'react';
import Card from '@mui/material/Card';
import { CardContent, Grid, TextField } from '@mui/material';
import TokenButton from './TokenButton';

function SelectCoin({selectedCoin, amount, setAmount, selectedCoinImg, type, openModal}) {
    return (
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
                            <TokenButton 
                                text={selectedCoin ? selectedCoin.name.toUpperCase() : ''}
                                imageSrc={selectedCoinImg}
                                onClick={() => openModal(type)}
                            ></TokenButton>
                        </Grid>
                        <Grid item xs={10} container justifyContent='flex-end'>
                            <TextField
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                onInput={(e) => {
                                    e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                                }}
                                variant='standard'
                                sx={{
                                    color: 'white',
                                    backgroundColor: '#1f273a',
                                    width: '70%',
                                    boxShadow: 'none'
                                }}
                                inputProps={{ style: {
                                        textAlign: 'right',
                                        color: 'white',
                                        fontSize: '1.5rem',
                                    }
                                }}
                                type='text'
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Grid>
    );
}

export default SelectCoin;
