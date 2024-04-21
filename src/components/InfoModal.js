import React from 'react';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import PrimaryButton from './PrimaryButton';
import { ModalContent, StyledModal, ModalTitle } from '../sharedStyles/general';
import SecondaryButton from './SecondaryButton';


function InfoModal({ open, msgText, onOkClose, onCancelClose }) {
    return (
        <StyledModal
            open={open}
            onClose={() => {
                onCancelClose();
            }}
            aria-labelledby='transaction-status-modal'
            aria-describedby='transaction-status-description'
        >
            <ModalContent>
                <ModalTitle id='transaction-status-modal' variant='h5' component='h2'>
                    Info
                </ModalTitle>
                <Box display='grid' justifyContent='center'>
                    <Typography id='transaction-status-description' textAlign='center'>
                        {msgText}
                    </Typography>
                </Box>
                <Box display='flex' justifyContent='center' mt={2} gap={1}>
                    <PrimaryButton onClick={onOkClose} buttonText='Ok' />
                    <SecondaryButton onClick={onCancelClose} buttonText='Cancel' />
                </Box>
            </ModalContent>
        </StyledModal>
    );
}

export default InfoModal;
