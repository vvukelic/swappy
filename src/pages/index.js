import React, { useState } from 'react';
import styled from '@emotion/styled';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Card, CardMedia, Box, AppBar, Toolbar } from '@mui/material';
import Button from '@mui/material/Button';
import PrimaryButton from '../components/PrimaryButton';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { BackgroundBox, FooterContainer } from '../sharedStyles/general';

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

const BoldText = styled.span`
    font-weight: bold;
`;

const StyledNavButton = styled(Button)`
    margin-left: 10px;
    color: white;
    background-color: transparent;
    border: 1px solid transparent;

    &:hover {
        background-color: #396777;
        border-color: #ffffff;
    }
`;

export default function HomePage() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const [drawerOpen, setDrawerOpen] = useState(false);

    function onDappBtnClick() {
        window.location.href = '/swap';
    }

    const HeaderItems = () => (
        <>
            <a href='/Swappy whitepaper.pdf' target="_blank" rel="noopener noreferrer">
                <StyledNavButton>Whitepaper</StyledNavButton>
            </a>
            {/* <StyledNavButton>Community</StyledNavButton> */}
            <Box sx={{ flexGrow: 1 }} />
            <PrimaryButton onClick={onDappBtnClick} buttonText='Launch app' />
        </>
    );

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
                        {isMobile ? (
                            <>
                                <Box flexGrow={1} />
                                <IconButton edge='start' color='inherit' aria-label='menu' onClick={() => setDrawerOpen(true)}>
                                    <MenuIcon />
                                </IconButton>
                                <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiPaper-root': { backgroundColor: '#1B3A47' } }}>
                                    <Box sx={{ width: 250, padding: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <HeaderItems />
                                    </Box>
                                </Drawer>
                            </>
                        ) : (
                            <HeaderItems />
                        )}
                    </Toolbar>
                </AppBar>
            </Box>
            <FrontpageBackgroundBox>
                <ContentContainer>
                    <TextContainer>
                        <h1>What is Swappy?</h1>
                        <p>
                            Swappy is a platform for decentralized, <BoldText>peer-to-peer (P2P)</BoldText> swaps, offering users a trustless environment for <BoldText>over-the-counter (OTC)</BoldText> trading.
                        </p>
                        <PrimaryButton onClick={onDappBtnClick} buttonText='Try it out' />
                    </TextContainer>
                    {!isMobile && (
                        <ImageContainer>
                            <img src='/images/swappy_logo.png' alt='Descriptive Alt Text' style={{ maxWidth: '100%', height: 'auto' }} />
                        </ImageContainer>
                    )}
                </ContentContainer>
                <ContentContainer>
                    <ImageContainer>
                        <img src='/images/example.png' alt='Descriptive Alt Text' style={{ maxWidth: '100%', height: 'auto' }} />
                    </ImageContainer>
                    <TextContainer>
                        <h1>How to use Swappy?</h1>
                        <ul>
                            <li>
                                Select a <BoldText>token</BoldText> you want <BoldText>to send</BoldText>
                            </li>
                            <li>
                                Type in the <BoldText>amount</BoldText> you want <BoldText>to send</BoldText>
                            </li>
                            <li>
                                Select a <BoldText>token</BoldText> you want <BoldText>to receive</BoldText>
                            </li>
                            <li>
                                Type in the <BoldText>amount</BoldText> you want <BoldText>to receive</BoldText>
                            </li>
                            <li>
                                Create a <BoldText>swap offer</BoldText>
                            </li>
                            <li>
                                <BoldText>Send the url of the swap offer</BoldText> to your counterparty
                            </li>
                        </ul>
                        <PrimaryButton onClick={onDappBtnClick} buttonText='Create a swap offer' />
                    </TextContainer>
                </ContentContainer>
                <ContentContainer>
                    {isMobile && (
                        <ImageContainer>
                            <img src='/images/swappy_thinking.png' alt='Descriptive Alt Text' style={{ maxWidth: '75%', height: 'auto' }} />
                        </ImageContainer>
                    )}
                    <TextContainer>
                        <h1>Why Swappy?</h1>
                        <ul>
                            <li>
                                <BoldText>Trustless transactions</BoldText> enabled by smart contract technology
                            </li>
                            <li>
                                Direct <BoldText>P2P trading</BoldText>, cutting out the middleman
                            </li>
                            <li>
                                Support for <BoldText>partial swap offers</BoldText>, enhancing flexibility
                            </li>
                            <li>
                                <BoldText>Secure and transparent</BoldText> process with blockchain verification
                            </li>
                            <li>User-friendly interface for easy trading</li>
                        </ul>
                    </TextContainer>
                    {!isMobile && (
                        <ImageContainer>
                            <img src='/images/swappy_thinking.png' alt='Descriptive Alt Text' style={{ maxWidth: '75%', height: 'auto' }} />
                        </ImageContainer>
                    )}
                </ContentContainer>
            </FrontpageBackgroundBox>
            <FooterContainer>© 2024 Swappy</FooterContainer>
        </>
    );
}

export async function getStaticProps() {
    return {
        props: {},
    };
}
