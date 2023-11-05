import { Grid } from '@mui/material';
import styled from '@emotion/styled';


const StyledGrid = styled(Grid)`
    text-align: center;
    margin: auto;
    border-radius: 8px;
    padding: 2em 0.5em;
    background-color: #358A9F;
    color: white;

    @media (max-width: 600px) {
        max-width: 90%;
    }

    @media (min-width: 600px) {
        max-width: 600px;
    }
`;

function MainContentContainer({ children }) {
    return (
        <StyledGrid container spacing={2}>
            {children}
        </StyledGrid>
    );
}

export default MainContentContainer;
