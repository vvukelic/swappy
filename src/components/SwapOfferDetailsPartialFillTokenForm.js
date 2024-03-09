import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Avatar, Grid, Typography, Box, TextField, Slider } from '@mui/material';
import styled from '@emotion/styled';
import BorderSection from './BorderSection';
import { getTokenImageUrl } from '../utils/tokens';

const StyledContainerGrid = styled(Grid)`
    align-items: center;
    width: 100%;
`;

const StyledAvatarBox = styled(Box)`
    padding: 1em;
    justify-content: center;
    display: flex;
`;

const StyledAmountGrid = styled(Grid)`
    text-align: center;
    min-width: 100px;
`;

const StyledTextField = styled(TextField)`
    & .MuiInputBase-input {
        font-size: 2em;
        text-align: center;
        color: white;
        height: 0.5em;
    }

    & .MuiOutlinedInput-root {
        &.Mui-focused .MuiOutlinedInput-notchedOutline {
            border-color: transparent; // Remove border on focus
        }
    }

    & .MuiOutlinedInput-notchedOutline {
        border: none; // Remove border
    }
`;

const StyledSlider = styled(Slider)`
    margin-top: 10px;
    color: #f7b93e;
    width: 12em;
`;

function SwapOfferDetailsPartialFillTokenForm({ token, amount, maxAmount, setAmount, tokenDecimals, labelText }) {
    const [displayAmount, setDisplayAmount] = useState('');
    const [sliderValue, setSliderValue] = useState(0);

    useEffect(() => {
        if (!displayAmount) {
            const displayAmount = ethers.utils.formatUnits(amount.toString(), tokenDecimals);
            setDisplayAmount(displayAmount);
            setSliderValue(displayAmount);
        }
    }, [amount, tokenDecimals]);

    const imageUrl = getTokenImageUrl(token);

    function formatValue(val) {
        let value = val
            .replace(/[^\d.]/g, '') // Allow numbers and dot only.
            .replace(/^0+(\d)/, '$1') // Remove leading zeros.
            .replace(/(\..*)\./g, '$1'); // Allow only one decimal point.

        if (value === '.') {
            value = '0.';
        }

        const regex = new RegExp(`(\\.\\d{0,${tokenDecimals}}).*`);
        const formattedValue = value.replace(regex, '$1');
        
        return formattedValue;
    }

    function handleAmountOnChange(e) {
        const formattedValue = formatValue(e.target.value);

        setDisplayAmount(formattedValue);
        setSliderValue(formattedValue);

        if (formattedValue) {
            const parsedValue = ethers.utils.parseUnits(formattedValue || '0', tokenDecimals);
            setAmount(parsedValue);
        }
    }

    function handleAmountOnBlur(e) {
        const formattedValue = formatValue(e.target.value);

        if (formattedValue) {
            const parsedValue = ethers.utils.parseUnits(formattedValue || '0', tokenDecimals);

            if (parsedValue.gt(maxAmount)) {
                setDisplayAmount(ethers.utils.formatUnits(maxAmount.toString(), tokenDecimals));
            } else {
                setDisplayAmount(ethers.utils.formatUnits(parsedValue.toString(), tokenDecimals));
            }
        }
    }

    const handleSliderChange = (event, newValue) => {
        let newValueBN = ethers.utils.parseUnits(newValue.toFixed(tokenDecimals).toString(), tokenDecimals);
        const maxAmountBN = ethers.utils.parseUnits(ethers.utils.formatUnits(maxAmount, tokenDecimals), tokenDecimals);
        const marginBN = maxAmountBN.div(ethers.utils.parseUnits('100', 0));

        if (maxAmountBN.sub(newValueBN).lte(marginBN)) {
            newValueBN = maxAmountBN;
        }

        const formattedValue = ethers.utils.formatUnits(newValueBN, tokenDecimals);
        setSliderValue(parseFloat(formattedValue));
        setDisplayAmount(formattedValue);
        setAmount(newValueBN);
    };


    const stepPercentage = 0.0001; // 0.01%
    const maxAmountInUnits = ethers.utils.formatUnits(maxAmount.toString(), tokenDecimals);
    const stepValue = maxAmountInUnits * stepPercentage;

    return (
        <BorderSection title={labelText}>
            <StyledContainerGrid container>
                <Grid item xs={3}>
                    <StyledAvatarBox>
                        <Avatar src={imageUrl} sx={{ width: '64px', height: '64px' }} />
                    </StyledAvatarBox>
                </Grid>
                <StyledAmountGrid item xs={9}>
                    <StyledTextField value={displayAmount} onChange={handleAmountOnChange} onBlur={handleAmountOnBlur} inputProps={{ 'aria-label': 'amount' }} />
                    {token && <Typography>{token.name.toUpperCase()}</Typography>}
                    <StyledSlider
                        value={sliderValue}
                        onChange={handleSliderChange}
                        min={0}
                        max={ethers.utils.formatUnits(maxAmount.toString(), tokenDecimals)}
                        step={stepValue}
                        inputProps={{
                            'aria-label': '',
                            autoComplete: 'off'
                        }}
                    />
                </StyledAmountGrid>
            </StyledContainerGrid>
        </BorderSection>
    );
}

export default SwapOfferDetailsPartialFillTokenForm;
