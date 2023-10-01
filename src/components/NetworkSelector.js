import Button from '@mui/material/Button';
import styled from '@emotion/styled';

const StyledButton = styled(Button)`
    color: white;
    background-color: #653d73;

    &:hover {
        background-color: #855895;
    }
`;

function NetworkSelector({ networkName, sx }) {
    return <StyledButton sx={{ ...sx, variant: 'h6' }}>{networkName}</StyledButton>;
}

export default NetworkSelector;
