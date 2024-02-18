import React from 'react';
import Card from '@mui/material/Card';
import { Grid, TextField, Button } from '@mui/material';
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

const MaxButton = styled(Button)`
    background-color: #F7B93E;
    color: black;
    min-width: 32px;
    height: 20px;
    font-size: 0.75rem;
    padding:  4px 8px;

    &:hover {
        background-color: #FFD684;
    }
`;

function SelectToken({ selectedToken, amount, setAmount, selectedTokenImg, labelText, openModal, selectedTokenAccountBalance }) {
    function handleMaxButtonClick() {
        setAmount(selectedTokenAccountBalance);
    }

    return (
        <BorderedSection title={labelText}>
            <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '1.6em', marginBottom: selectedTokenAccountBalance ? '0.4em' : '1.6em' }}>
                <Grid container spacing={2}>
                    <Grid item xs={4} style={{ paddingTop: 0, paddingLeft: '16px' }}>
                        <TokenButton text={selectedToken ? selectedToken.name.toUpperCase() : ''} imageSrc={selectedTokenImg} onClick={openModal} />
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
                    {selectedTokenAccountBalance && (
                        <Grid item xs={12} container justifyContent='flex-end' alignItems='center' style={{ paddingRight: '0', marginTop: '0.0em', color: 'white' }}>
                            <span style={{ marginRight: '10px' }}>Balance: {selectedTokenAccountBalance}</span>
                            <MaxButton onClick={handleMaxButtonClick} variant='outlined' size='small'>
                                Max
                            </MaxButton>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </BorderedSection>
    );
}

export default SelectToken;
