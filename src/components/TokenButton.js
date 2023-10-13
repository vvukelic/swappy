import React from 'react';
import Box from '@mui/material/Box';
import { Button, Typography } from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';
import styled from '@emotion/styled';

const StyledButton = styled(Button)`
    color: white;
    background-color: #224e5d;
    border-radius: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    height: 48px;
    padding-left: 8px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;

    &:hover {
        background-color: #396777;
    }
`;

const StyledBox = styled(Box)`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    overflow: hidden;
    display: inline-flex;
    align-items: left;
    justify-content: center;
    margin-left: 0.2em;
`;

const StyledTypography = styled(Typography)`
    color: white;
    flex-grow: 2;
    text-align: center;
`;

function TokenButton({ imageSrc, text, onClick, ...props }) {
    return (
        <StyledButton onClick={onClick}>
            <StyledBox component='span'>
                <img src={imageSrc} width='auto' height='100%' />
            </StyledBox>
            <StyledTypography>{text}</StyledTypography>
            <ArrowDropDown width='0.9em'></ArrowDropDown>
        </StyledButton>
    );
}

export default TokenButton;
