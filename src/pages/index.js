import React, { useState } from 'react';
import styled from '@emotion/styled';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Card, CardMedia, Box, AppBar, Toolbar } from '@mui/material';
import Button from '@mui/material/Button';
import PrimaryButton from '../components/PrimaryButton';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { BackgroundBox, SwappyHome, FooterContainer, StyledTabButton, DropdownHoverMenu, DropdownHoverMenuButton } from '../sharedStyles/general';
import DropdownElement from '../components/DropdownElement';

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
        margin-bottom: 1em;
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
    padding-left: 100px;
    padding-right: 100px;
    justify-content: space-between;
    margin-bottom: 1.5em;

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
    const [showDevelopmentHoverMenu, setShowDevelopmentHoverMenu] = useState(false);
    const [showSocialHoverMenu, setShowSocialHoverMenu] = useState(false);

    function onDappBtnClick() {
        window.location.href = '/swap';
    }

    const HeaderItems = () => (
        <>
            <DropdownElement setShowHoverMenu={setShowDevelopmentHoverMenu}>
                <StyledTabButton isActive={false}>
                    Development
                </StyledTabButton>
                <DropdownHoverMenu show={showDevelopmentHoverMenu} width='170px'>
                    <DropdownHoverMenuButton isActive={false} onClick={() => window.open('/Swappy whitepaper.pdf', '_blank', 'noopener,noreferrer')}>
                        Whitepaper
                    </DropdownHoverMenuButton>
                    <DropdownHoverMenuButton isActive={false} onClick={() => window.open('https://github.com/vvukelic/swappy', '_blank', 'noopener,noreferrer')}>
                        Github
                    </DropdownHoverMenuButton>
                </DropdownHoverMenu>
            </DropdownElement>
            <DropdownElement setShowHoverMenu={setShowSocialHoverMenu}>
                <StyledTabButton isActive={false}>
                    Social
                </StyledTabButton>
                <DropdownHoverMenu show={showSocialHoverMenu} width='170px'>
                    <DropdownHoverMenuButton isActive={false} onClick={() => window.open('https://x.com/swappy_fi', '_blank', 'noopener,noreferrer')}>
                        X / Twitter
                    </DropdownHoverMenuButton>
                </DropdownHoverMenu>
            </DropdownElement>
            <Box sx={{ flexGrow: 1 }} />
            <PrimaryButton onClick={onDappBtnClick} buttonText='Launch app' />
        </>
    );

    return (
        <>
            <Box sx={{ flexGrow: 1, padding: 0, margin: 0 }}>
                <AppBar position='sticky' elevation={0} component='nav'>
                    <Toolbar sx={{ backgroundColor: '#1b2a47' }}>
                        <Card
                            sx={{
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                padding: '0.5em',
                            }}
                        >
                            <SwappyHome image='/images/swappy-head-1.svg' />
                        </Card>
                        {isMobile ? (
                            <>
                                <Box flexGrow={1} />
                                <IconButton edge='start' color='inherit' aria-label='menu' onClick={() => setDrawerOpen(true)}>
                                    <MenuIcon />
                                </IconButton>
                                <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiPaper-root': { backgroundColor: '#1b2a47' } }}>
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
                    <TextContainer style={{ textAlign: 'center' }}>
                        <h1>Welcome to Swappy!</h1>
                        <p>
                            Swappy is a platform for decentralized, <BoldText>peer-to-peer (P2P)</BoldText> swaps, offering users a trustless environment for <BoldText>over-the-counter (OTC)</BoldText> trading.
                        </p>
                        <ImageContainer>
                            <img src='/images/eth-logo.svg' alt='Eth logo' style={{ width: '50px', height: 'auto' }} />
                            <img src='/images/optimism-logo.svg' alt='Optimism logo' style={{ width: '50px', height: 'auto' }} />
                            <img src='/images/arbitrum-logo.svg' alt='Arbitrum logo' style={{ width: '50px', height: 'auto' }} />
                            <img src='/images/matic-logo.svg' alt='Matic logo' style={{ width: '50px', height: 'auto' }} />
                            <img src='/images/bnb-logo.svg' alt='Bnb logo' style={{ width: '50px', height: 'auto' }} />
                        </ImageContainer>
                        <PrimaryButton onClick={onDappBtnClick} buttonText='Try it out' />
                    </TextContainer>
                </ContentContainer>
                <ContentContainer>
                    <ImageContainer>
                        <img src='/images/example.png' alt='Example' style={{ maxWidth: '100%', height: 'auto' }} />
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
                            <img src='/images/swappy_playing.png' alt='Descriptive Alt Text' style={{ maxWidth: '75%', height: 'auto' }} />
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
                            <img src='/images/swappy_playing.png' alt='Descriptive Alt Text' style={{ maxWidth: '75%', height: 'auto' }} />
                        </ImageContainer>
                    )}
                </ContentContainer>
            </FrontpageBackgroundBox>
            <FooterContainer>© 2025 Swappy</FooterContainer>
        </>
    );
}

export async function getStaticProps() {
    return {
        props: {},
    };
}
