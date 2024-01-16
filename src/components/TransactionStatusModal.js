import React from 'react';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
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

// TransactionStatusModal Component
function TransactionStatusModal({ open, status, statusTxt, errorTxt, onClose }) {
    return (
        <StyledModal
            open={open}
            onClose={() => {
                onClose;
            }}
            aria-labelledby='transaction-status-modal'
            aria-describedby='transaction-status-description'
        >
            <ModalContent>
                <Title id='transaction-status-modal' variant='h6' component='h2'>
                    Transaction Status
                </Title>
                <Box display='flex' justifyContent='center'>
                    {status == 'mining' && (
                        <Typography id='transaction-status-description'>{statusTxt}</Typography>
                    )}
                    {status == 'success' && (
                        <Typography id='transaction-status-description'>{statusTxt}</Typography>
                    )}
                    {status == 'fail' && (
                        <Typography>{errorTxt}</Typography>
                    )}
                </Box>
                <Box display='flex' justifyContent='center' mt={2}>
                    <PrimaryButton onClick={onClose} buttonText='Close' />
                </Box>
            </ModalContent>
        </StyledModal>
    );
}

export default TransactionStatusModal;
