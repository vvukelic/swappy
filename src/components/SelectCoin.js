import React from 'react';
import Card from '@mui/material/Card';
import { Grid, TextField } from '@mui/material';
import TokenButton from './TokenButton';
import styled from '@emotion/styled';
import BorderedSection from './BorderSection';

const StyledTextField = styled(TextField)`
    color: black;
    background-color: #d9d9d9;
    width: 100%;
    box-shadow: none;
    underline: none;
    height: 48px;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
`;

const StyledCard = styled(Card)`
    background-color: #358a9e;
    height: 120px;
    border-radius: 4px;
    border-color: #286676;
    margin-right: 16px;
    margin-left: 16px;
`;

function SelectCoin({ selectedCoin, amount, setAmount, selectedCoinImg, type, openModal }) {
    const labelText = type === 'src' ? 'You sell' : 'You buy';

    return (
        <BorderedSection title={labelText}>
            <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '1.6em' }}>
                <Grid container spacing={2}>
                    <Grid item xs={4} style={{ paddingTop: 0, paddingLeft: '16px' }}>
                        <TokenButton text={selectedCoin ? selectedCoin.name.toUpperCase() : ''} imageSrc={selectedCoinImg} onClick={() => openModal(type)} />
                    </Grid>
                    <Grid item xs={8} container justifyContent='flex-end' style={{ paddingTop: 0, paddingLeft: 0 }}>
                        <StyledTextField
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onInput={(e) => {
                                e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                            }}
                            variant='standard'
                            sx={{
                                '& .MuiInput-underline:after': {
                                    borderBottom: 'none',
                                },
                                '& .MuiInput-underline:before': {
                                    borderBottom: 'none',
                                },
                                '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                    borderBottom: 'none',
                                },
                            }}
                            inputProps={{
                                style: {
                                    textAlign: 'right',
                                    color: 'black',
                                    fontSize: '1.5rem',
                                    paddingBottom: 0,
                                    paddingTop: 8,
                                    paddingLeft: 0,
                                    paddingRight: 8,
                                    borderRadius: '20px',
                                },
                            }}
                            InputLabelProps={{
                                style: {
                                    padding: '8px',
                                },
                            }}
                            type='text'
                        />
                    </Grid>
                    <Grid item xs={12} style={{ textAlign: 'right', color: 'white', padding: '0 4px', marginBottom: '5px', marginTop: '0.3em' }}>
                        <span>~$1 229.12</span>
                    </Grid>
                </Grid>
            </Grid>
        </BorderedSection>
    );
}

export default SelectCoin;
