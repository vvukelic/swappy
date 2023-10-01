import React from 'react';
import Box from '@mui/material/Box';
import { Button, Typography } from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';
import styled from '@emotion/styled';

const StyledButton = styled(Button)`
    color: white;
    background-color: #224e5d;
    border-radius: 0;
    width: 140px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
        background-color: #396777;
    }
`;

const StyledBox = styled(Box)`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    display: inline-flex;
    align-items: left;
    justify-content: center;
    margin-right: 1;
`;

function TokenButton({ imageSrc, text, onClick, ...props }) {
    return (
        <StyledButton onClick={onClick}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <StyledBox component='span'>
                    <img src={imageSrc} width='auto' height='100%' />
                </StyledBox>
                <Typography
                    sx={{
                        color: 'white',
                        marginLeft: 1,
                    }}
                >
                    {text}
                </Typography>
            </div>
            <ArrowDropDown></ArrowDropDown>
        </StyledButton>
    );
}

export default TokenButton;
