import { Avatar, Grid, Typography, Box } from '@mui/material';
import styled from '@emotion/styled';
import BorderSection from './BorderSection';
import { getTokenImageUrl } from '../utils/tokens';


const StyledContainerGrid = styled(Grid)`
    align-items: center;
    width: 100%;
`;

const StyledAmountTypography = styled(Typography)`
    font-size: 2em;
`;

const StyledAvatarBox= styled(Box)`
    padding: 1em;
    justify-content: center;
    display: flex;
`;

const StyledAmountGrid = styled(Grid)`
    text-align: center;
    min-width: 100px;
`;

function SwapDetailsTokenInfo({ token, amount, labelText }) {
    const imageUrl = getTokenImageUrl(token);

    return (
        <BorderSection title={labelText}>
            <StyledContainerGrid container>
                <Grid item xs={3}>
                    <StyledAvatarBox>
                        <Avatar src={imageUrl} sx={{ width: '64px', height: '64px' }} />
                    </StyledAvatarBox>
                </Grid>
                <StyledAmountGrid item xs={9}>
                    {token && <StyledAmountTypography>{amount}</StyledAmountTypography>}
                    {token && <Typography>{token.name.toUpperCase()}</Typography>}
                </StyledAmountGrid>
            </StyledContainerGrid>
        </BorderSection>
    );
}

export default SwapDetailsTokenInfo;
