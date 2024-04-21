import React from 'react';
import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import Modal from '@mui/material/Modal';


const TruncateBase = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
`;


export const Truncate = React.forwardRef((props, ref) => <TruncateBase ref={ref} {...props} />);

export const BackgroundBox = styled(Box)`
    min-height: calc(100vh - 100px);
    background: linear-gradient(to bottom, #1b3a47, #45bbd6);
    padding-top: 3em;

    @media (max-width: 600px) {
        padding-top: 1.5em;
    }
`;

export const ModalContent = styled.div`
    background-color: #358a9f;
    padding: 20px;
    border-radius: 10px;
    outline: none;
    color: white;
    min-width: 500px;
    max-width: 600px;
    width: '80%';

    @media (max-width: 600px) {
        min-width: 100%;
    }
`;

export const StyledModal = styled(Modal)`
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const ModalTitle = styled(Typography)`
    font-weight: bold;
    text-align: center;
    margin-bottom: 0.5em;
`;
