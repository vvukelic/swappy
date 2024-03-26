import React from 'react';
import styled from '@emotion/styled';
import { Card, CardMedia, Box, AppBar, Toolbar } from '@mui/material';
import PrimaryButton from '../components/PrimaryButton';
import { BackgroundBox } from '../sharedStyles/general';


const ContentContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 50px;
    gap: 20px;
    max-width: 1300px;
    max-height: 560px;
    margin-bottom: 3em;

    @media (max-width: 600px) {
        flex-direction: column;
        padding: 0 15px;
        max-height: 1120px;
    }
`;

const FrontpageBackgroundBox = styled(BackgroundBox)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 0;
`;

const TextContainer = styled.div`
    margin-top: 2em;
    padding: 0 2em;
    flex: 1;
    max-width: 600px;
    color: white;
    font-size: 1.3em;

    p {
        margin-bottom: 3em;
    }

    ul {
        margin-bottom: 2.5em;
    }

    @media (max-width: 768px) {
        margin-top: 1em;
        padding: 0 1em;
        font-size: 1em;
        p {
            margin-bottom: 2em;
        }
    }
`;

const ImageContainer = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;

    @media (max-width: 768px) {
        margin-top: 2em;
    }
`;

const FooterContainer = styled(Box)`
    width: 100%;
    padding: 1em 0;
    background-color: #1b3a47;
    color: white;
    text-align: center;
    font-size: 0.9em;
    margin-top: auto;
`;

export default () => {
    function onDappBtnClick() {
        window.location.href = '/swap';
    }

    return (
        <>
            <Box sx={{ flexGrow: 1, padding: 0, margin: 0 }}>
                <AppBar position='sticky' elevation={0} component='nav'>
                    <Toolbar sx={{ backgroundColor: '#1B3A47' }}>
                        <Card
                            sx={{
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                            }}
                        >
                            <CardMedia
                                sx={{
                                    width: '100px',
                                    height: '100px',
                                    backgroundColor: 'transparent',
                                }}
                                image='/images/swappy_logo.png'
                            />
                        </Card>
                        <Box sx={{ flexGrow: 1 }} />
                        <PrimaryButton onClick={onDappBtnClick} buttonText='Launch app' />
                    </Toolbar>
                </AppBar>
            </Box>
            <FrontpageBackgroundBox>
                <ContentContainer>
                    <TextContainer>
                        <h1>What is Swappy?</h1>
                        <p>Swappy is a platform facilitating decentralized, peer-to-peer (P2P) swaps, offering users a trustless environment for over-the-counter (OTC) trading.</p>
                        <PrimaryButton onClick={onDappBtnClick} buttonText='Try it out' />
                    </TextContainer>
                    <ImageContainer>
                        <img src='/images/swappy_logo.png' alt='Descriptive Alt Text' style={{ maxWidth: '100%', height: 'auto' }} />
                    </ImageContainer>
                </ContentContainer>
                <ContentContainer>
                    <ImageContainer>
                        <img src='/images/example.png' alt='Descriptive Alt Text' style={{ maxWidth: '100%', height: 'auto' }} />
                    </ImageContainer>
                    <TextContainer>
                        <h1>How to use Swappy?</h1>
                        <ul>
                            <li>Select the token you want to send</li>
                            <li>Type in the amount you want to send</li>
                            <li>Select the token you want to receive</li>
                            <li>Type in the amount you want to receive</li>
                            <li>Create a swap offer</li>
                            <li>Send the url of the swap offer to your counterparty</li>
                        </ul>
                        <PrimaryButton onClick={onDappBtnClick} buttonText='Create a swap offer' />
                    </TextContainer>
                </ContentContainer>
                <ContentContainer>
                    <TextContainer>
                        <h1>Why Swappy?</h1>
                        <ul>
                            <li>Trustless transactions enabled by smart contract technology</li>
                            <li>Direct P2P trading, cutting out the middleman</li>
                            <li>Support for partial swap offers, enhancing flexibility</li>
                            <li>Secure and transparent process with blockchain verification</li>
                            <li>User-friendly interface for easy trading</li>
                        </ul>
                    </TextContainer>
                    <ImageContainer>
                        <img src='/images/swappy_thinking.png' alt='Descriptive Alt Text' style={{ maxWidth: '75%', height: 'auto' }} />
                    </ImageContainer>
                </ContentContainer>
            </FrontpageBackgroundBox>
            <FooterContainer>© 2024 Swappy</FooterContainer>
        </>
    );
};
