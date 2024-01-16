import React from 'react';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import { Box, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PrimaryButton from './PrimaryButton';
import styled from '@emotion/styled';

// Style for the overall modal background
const StyledModal = styled(Modal)`
    display: flex;
    align-items: center;
    justify-content: center;
`;

// Style for the modal content
const ModalContent = styled.div`
    background-color: #358a9f; // Your specified background color
    padding: 20px;
    border-radius: 10px;
    outline: none;
    color: white; // White text
    min-width: 500px;
    width: '80%';
`;

const Title = styled(Typography)`
    text-align: center;
`;

const StyledBox = styled(Box)`
    margin-top: 1em;
    margin-bottom: 1em;
`;

const StyledCheckCircleIcon = styled(CheckCircleIcon)`
    font-size: 3em;
`;

const StyledErrorIcon = styled(ErrorIcon)`
    font-size: 3em;
`;

// TransactionStatusModal Component
function TransactionStatusModal({ open, status, statusTxt, errorTxt, onClose }) {
    return (
        <StyledModal
            open={open}
            onClose={() => {
                onClose();
            }}
            aria-labelledby='transaction-status-modal'
            aria-describedby='transaction-status-description'
        >
            <ModalContent>
                <Title id='transaction-status-modal' variant='h5' component='h2'>
                    Transaction Status
                </Title>
                <StyledBox display='flex' justifyContent='center'>
                    {status === 'mining' && <CircularProgress color='inherit' />}
                    {status === 'success' && <StyledCheckCircleIcon />}
                    {status === 'fail' && <StyledErrorIcon />}
                </StyledBox>
                <Box display='flex' justifyContent='center'>
                    {status === 'mining' && <Typography id='transaction-status-description'>{statusTxt}</Typography>}
                    {status === 'success' && <Typography id='transaction-status-description'>{statusTxt}</Typography>}
                    {status === 'fail' && <Typography>{errorTxt}</Typography>}
                </Box>
                <Box display='flex' justifyContent='center' mt={2}>
                    <PrimaryButton onClick={onClose} buttonText='Close' />
                </Box>
            </ModalContent>
        </StyledModal>
    );
}

export default TransactionStatusModal;
