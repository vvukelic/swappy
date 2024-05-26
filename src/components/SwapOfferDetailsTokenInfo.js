import { Avatar, Grid, Typography, Box, Link } from '@mui/material';
import styled from '@emotion/styled';
import BorderSection from './BorderSection';
import { getTokenImageUrl } from '../utils/tokens';
import { StyledTokenLinkName } from '../sharedStyles/general';

const StyledContainerGrid = styled(Grid)`
    align-items: center;
    width: 100%;
`;

const StyledAmountTypography = styled(Typography)`
    font-size: 2em;
    word-break: break-word;
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

function SwapOfferDetailsTokenInfo({ token, tokenUrl, amount, labelText }) {
    const imageUrl = getTokenImageUrl(token);

    return (
        <BorderSection title={labelText}>
            <StyledContainerGrid container>
                <Grid item xs={3}>
                    <StyledAvatarBox>
                        <Link href={tokenUrl} target='_blank' rel='noopener noreferrer'>
                            <Avatar src={imageUrl} sx={{ width: '64px', height: '64px' }} />
                        </Link>
                    </StyledAvatarBox>
                </Grid>
                <StyledAmountGrid item xs={9}>
                    {token && <StyledAmountTypography>{amount}</StyledAmountTypography>}
                    {token && (
                        <Link href={tokenUrl} target='_blank' rel='noopener noreferrer' style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                            <StyledTokenLinkName>{token.symbol}</StyledTokenLinkName>
                        </Link>
                    )}
                </StyledAmountGrid>
            </StyledContainerGrid>
        </BorderSection>
    );
}

export default SwapOfferDetailsTokenInfo;
