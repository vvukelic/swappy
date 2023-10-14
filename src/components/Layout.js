import React from 'react';
import { Box } from '@mui/material';
import styled from '@emotion/styled';
import Header from './Header';
import { AccountProvider } from '../context/AccountContext';


const StyledBox = styled(Box)`
    min-height: calc(100vh - 100px);
    background: linear-gradient(to bottom, #1b3a47, #45bbd6);
    padding-top: 3em;
`;

export default ({ children, activeTab, setActiveTab }) => {
    return (
        <AccountProvider>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />
            <StyledBox>{children}</StyledBox>
        </AccountProvider>
    );
};
