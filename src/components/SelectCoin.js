import React from 'react';
import Card from '@mui/material/Card';
import { Grid, TextField } from '@mui/material';
import TokenButton from './TokenButton';
import styled from '@emotion/styled';

const StyledTextField = styled(TextField)`
    color: black;
    background-color: #d9d9d9;
    width: 100%;
    height: 44px;
    box-shadow: none;
    padding: 0;
`;

function SelectCoin({ selectedCoin, amount, setAmount, selectedCoinImg, type, openModal }) {
    const labelText = type === 'src' ? 'You send' : 'You receive';

    return (
        <Grid item xs={12} sx={{ padding: '0 16px' }}>
            <Card>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <TokenButton text={selectedCoin ? selectedCoin.name.toUpperCase() : ''} imageSrc={selectedCoinImg} onClick={() => openModal(type)}></TokenButton>
                    </Grid>
                    <Grid item xs={8} container justifyContent='flex-end'>
                        <StyledTextField
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onInput={(e) => {
                                e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                            }}
                            variant='filled'
                            label={labelText}
                            inputProps={{
                                style: {
                                    textAlign: 'right',
                                    color: 'black',
                                    fontSize: '1.5rem',
                                    padding: 5,
                                    borderRadius: 0,
                                },
                            }}
                            type='text'
                        />
                    </Grid>
                </Grid>
            </Card>
        </Grid>
    );
}

export default SelectCoin;
