import React, { useState, useEffect } from 'react';
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

    & .MuiInput-underline:after {
        border-bottom: none;
    }

    & .MuiInput-underline:before {
        border-bottom: none;
    }

    & .MuiInput-underline:hover:not(.Mui-disabled):before {
        border-bottom: none;
    }
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
    const [displayAmount, setDisplayAmount] = useState('0.0');

    function handleAmountOnChange(e) {
        const value = e.target.value.replace(/^0+/, '').replace(/(\..*?)\..*/g, '$1');
        setDisplayAmount(value);
    }

    function handleAmountOnBlur() {
        let formattedValue = displayAmount;

        if (formattedValue === '.' || formattedValue === '') {
            formattedValue = '0.0';
        }
        else if (formattedValue.startsWith('.')) {
            formattedValue = '0' + formattedValue;
        }

        setDisplayAmount(formattedValue);
        setAmount(formattedValue);
    }

    function handleMaxButtonClick() {
        setDisplayAmount(selectedTokenAccountBalance);
    }

    useEffect(() => {
        if (displayAmount && displayAmount !== '.') {
            setAmount(displayAmount);
        } else {
            setAmount('0.0');
        }
    }, [displayAmount]);

    return (
        <BorderedSection title={labelText}>
            <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '1.6em', marginBottom: selectedTokenAccountBalance ? '0.4em' : '1.6em' }}>
                <Grid container spacing={2}>
                    <Grid item xs={4} style={{ paddingTop: 0, paddingLeft: '16px' }}>
                        <TokenButton text={selectedToken ? selectedToken.name.toUpperCase() : ''} imageSrc={selectedTokenImg} onClick={openModal} />
                    </Grid>
                    <Grid item xs={8} container justifyContent='flex-end' style={{ paddingTop: 0, paddingLeft: 0 }}>
                        <StyledTextField
                            value={displayAmount}
                            onChange={handleAmountOnChange}
                            onBlur={handleAmountOnBlur}
                            variant='standard'
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
