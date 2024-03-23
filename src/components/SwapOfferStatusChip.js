import React from 'react';
import styled from '@emotion/styled';
import { Chip, Tooltip } from '@mui/material';
import AddCircleOutlineSharpIcon from '@mui/icons-material/AddCircleOutlineSharp';
import CheckCircleOutlineSharpIcon from '@mui/icons-material/CheckCircleOutlineSharp';
import HighlightOffSharpIcon from '@mui/icons-material/HighlightOffSharp';


function getBackgroundColor(status) {
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

    return backgroundColor;
}

const StyledChip = styled(Chip)(({ status }) => {
    const backgroundColor = getBackgroundColor(status);

    return `
        color: white;
        background-color: ${backgroundColor};
    `;
});

function SwapOfferStatusChip({ status, isMobile }) {
    const backgroundColor = getBackgroundColor(status);
    let icon;

    switch (status) {
        case 'EXPIRED':
        case 'CANCELED':
        case 'ERROR':
            icon = <HighlightOffSharpIcon style={{ color: backgroundColor }} />;
            break;
        case 'OPENED':
            icon = <AddCircleOutlineSharpIcon style={{ color: backgroundColor }} />;
            break;
        case 'FILLED':
            icon = <CheckCircleOutlineSharpIcon style={{ color: '#dcdada' }} />;
            break;
    }

    let tooltipMessage = '';
    if (status === 'ERROR') {
        tooltipMessage = 'The creator of the swap offer no longer has the required token balance on their account. When this changes, the swap will be available for taking.';
    }

    return (
        <Tooltip title={tooltipMessage}>
            {isMobile ? (
                <>{icon}</>
            ) : (
                <StyledChip label={status} status={status} />
            )}
        </Tooltip>
    );
}

export default SwapOfferStatusChip;
