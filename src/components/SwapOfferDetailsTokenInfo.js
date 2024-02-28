import { ethers } from 'ethers';
import { Avatar, Grid, Typography, Box, TextField } from '@mui/material';
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

const StyledAvatarBox = styled(Box)`
    padding: 1em;
    justify-content: center;
    display: flex;
`;

const StyledAmountGrid = styled(Grid)`
    text-align: center;
    min-width: 100px;
`;

const StyledTextField = styled(TextField)`
    & .MuiInputBase-input {
        font-size: 2em; // Match the size of StyledAmountTypography
        text-align: center;
    }
`;

function SwapOfferDetailsTokenInfo({ token, amount, setAmount, tokenDecimals, labelText }) {
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
                    <StyledTextField value={ethers.utils.formatUnits(amount.toString(), tokenDecimals).toString()} onChange={(e) => setAmount(ethers.utils.parseUnits(e.target.value, tokenDecimals))} inputProps={{ 'aria-label': 'amount' }} />
                    {token && <Typography>{token.name.toUpperCase()}</Typography>}
                </StyledAmountGrid>
            </StyledContainerGrid>
        </BorderSection>
    );
}

export default SwapOfferDetailsTokenInfo;
