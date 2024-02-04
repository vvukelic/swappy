import { Chip } from '@mui/material';
import styled from '@emotion/styled';


const StyledChip = styled(Chip)(({ status }) => {
    let backgroundColor;

    switch (status) {
        case 'EXPIRED':
        case 'CANCELED':
            backgroundColor = '#f45050';
            break;
        case 'OPENED':
            backgroundColor = '#4fbe30';
            break;
        case 'SWAPPED':
            backgroundColor = '#07713d';
    }

    return `
        color: white;
        background-color: ${backgroundColor};
    `;
});

function SwapStatusChip({ status }) {
    return (
        <StyledChip label={status} status={status} />
    );
}

export default SwapStatusChip;
