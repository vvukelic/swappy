import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import styled from '@emotion/styled';


const StyledChip = styled(Chip)(({ status }) => {
    let backgroundColor;

    switch (status) {
        case 'EXPIRED':
        case 'CANCELED':
        case 'ERROR':
            backgroundColor = '#f45050';
            break;
        case 'OPENED':
            backgroundColor = '#4fbe30';
            break;
        case 'FILLED':
            backgroundColor = '';
            break;
    }

    return `
        color: white;
        background-color: ${backgroundColor};
    `;
});

function SwapOfferStatusChip({ status }) {
    return (
        <Tooltip title={status === 'ERROR' && 'The creator of the swap offer no longer has the required token balance on their account. When this changes, the swap will be available for taking.'}>
            <StyledChip label={status} status={status} />
        </Tooltip>
    );
}

export default SwapOfferStatusChip;
