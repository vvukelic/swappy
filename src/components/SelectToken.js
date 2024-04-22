import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Grid, TextField, Button } from '@mui/material';
import TokenButton from './TokenButton';
import styled from '@emotion/styled';
import BorderedSection from './BorderSection';

const StyledTextField = styled(TextField)`
    width: 100%;
    .MuiInputBase-input {
        color: black;
        background-color: #d9d9d9;
        height: 48px;
        box-shadow: none;
        border-radius: 4px;
        text-align: right;
        font-size: 1.5rem;
        padding: 0 8px;

        @media (max-width: 600px) {
            font-size: 0.9rem;
            padding: 0px 8px;
            height: 35px;
        }
    }

    .MuiInput-underline:after,
    .MuiInput-underline:before,
    .MuiInput-underline:hover:not(.Mui-disabled):before {
        border-bottom: none;
    }

    .MuiInputBase-root {
        height: auto;
    }

    .MuiInputLabel-root {
        padding: 8px;
    }
`;

const MaxButton = styled(Button)`
    background-color: #F7B93E;
    color: black;
    min-width: 32px;
    height: 20px;
    line-height: 1.5em;
    font-size: 0.75rem;
    padding:  4px 8px;

    &:hover {
        background-color: #FFD684;
    }
`;

const MaxButtonGrid = styled(Grid)`
    padding-right: 0;
    margin-top: 0;
    padding-top: 8px !important;
    color: white;
`;

const BalanceInfo = styled.span`
    margin-right: 10px;

    @media (max-width: 600px) {
        display: none;
    }
`;

function SelectToken({ selectedToken, selectedTokenDecimals, amount, setAmount, selectedTokenImg, labelText, openModal, selectedTokenAccountBalance }) {
    const [displayAmount, setDisplayAmount] = useState('');

    useEffect(() => {
        setDisplayAmount(amount);
    }, [selectedToken]);

    function handleAmountOnChange(e) {
        let value = e.target.value
            .replace(/[^\d.]/g, '') // Allow numbers and dot only.
            .replace(/^0+(\d)/, '$1') // Remove leading zeros.
            .replace(/(\..*)\./g, '$1'); // Allow only one decimal point.

        if (value === '.') {
            value = '0.';
        }

        const _selectedTokenDecimals = selectedTokenDecimals ? selectedTokenDecimals : 18;

        const regex = new RegExp(`(\\.\\d{0,${_selectedTokenDecimals}}).*`);
        const formattedValue = value.replace(regex, '$1');

        setDisplayAmount(formattedValue);
    }

    function handleAmountOnBlur() {
        let formattedValue = displayAmount;

        if (formattedValue === '.' || formattedValue === '') {
            formattedValue = '0.0';
        } else if (formattedValue.startsWith('.')) {
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
                            type='text'
                        />
                    </Grid>
                    {selectedTokenAccountBalance && (
                        <MaxButtonGrid item xs={12} container justifyContent='flex-end' alignItems='center'>
                            <BalanceInfo>Balance: {selectedTokenAccountBalance}</BalanceInfo>
                            <MaxButton onClick={handleMaxButtonClick} variant='outlined' size='small'>
                                Max
                            </MaxButton>
                        </MaxButtonGrid>
                    )}
                </Grid>
            </Grid>
        </BorderedSection>
    );
}

export default SelectToken;
