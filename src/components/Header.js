import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWeb3Modal } from '@web3modal/ethers5/react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Card, CardMedia } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import styled from '@emotion/styled';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getSupportedNetworks } from '../utils/general';
import PrimaryButton from './PrimaryButton';


const StyledToolbar = styled(Toolbar)`
    background-color: #1b3a47;
    justify-content: center;
    @media (max-width: 900px) {
        justify-content: space-between;
    }
`;

const RelativePositionContainer = styled.div`
    position: relative;
    display: grid;
`;

const StyledTabButton = styled(({ isActive, ...props }) => <Button {...props} />)`
    margin-left: 10px;
    color: white;
    background-color: ${(props) => (props.isActive ? '#396777' : 'transparent')};
    border: 1px solid transparent;

    &:hover {
        background-color: ${(props) => (props.isActive ? '#396777' : '#396777')};
        border-color: #ffffff;
    }
`;

const StyledTabMenuButton = styled(StyledTabButton)`
    margin-left: 0;
`;

const StyledHoverMenu = styled(Box)`
    position: absolute;
    width: ${(props) => props.width};
    background-color: #1b3a47;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    padding: 10px;
    display: ${(props) => (props.show ? 'flex' : 'none')};
    flex-direction: column;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);

    @media (max-width: 900px) {
        position: static;
        transform: none;
        left: 0;
        width: auto;
    }
`;
const NetworkButton = styled(({ bgColor, ...props }) => <Button {...props} />)`
    color: white;
    background-color: ${(props) => props.bgColor || 'transparent'};
    display: flex;
    align-items: center;
    border: 1px solid transparent;

    .network-icon {
        margin-right: 8px;
        height: 20px; // Adjust size as needed
    }

    &:hover {
        background-color: ${(props) => props.bgColor || 'transparent'};
        border-color: #ffffff;
    }

    @media (min-width: 900px) {
        margin-left: 10px;
        margin-right: 10px;
    }
`;


const SelectNetworkButton = styled(StyledTabButton)`
    display: flex;
    align-items: center;
    justify-content: left;
    margin: 5px;
    padding: 10px;
`;

const NetworkIcon = styled.img`
    width: 30px;
    height: 30px;
    margin-right: 10px;
`;

const SwappyHome = styled(CardMedia)`
    width: 100px;
    height: 100px;
    background-color: transparent;

    &:hover {
        cursor: pointer !important;
    }
`;

function Header({ activeTab, setActiveTab, activeSwapOffersListTab, setActiveSwapOffersListTab }) {
    const { defaultAccount, network, blockchainUtil, isAccountConnected } = useWalletConnect();
    const [nativeTokenBalance, setNativeTokenBalance] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width:900px)');
    const router = useRouter();
    const [showSwapOffersHoverMenu, setShowSwapOffersHoverMenu] = useState(false);
    const [showNetworksHoverMenu, setShowNetworksHoverMenu] = useState(false);
    const { open } = useWeb3Modal();

    useEffect(() => {
        const fetchBalance = async () => {
            if (defaultAccount) {
                let balance = await blockchainUtil.getNativeTokenBalance(defaultAccount);
                balance = ethers.utils.formatEther(balance);
                balance = parseFloat(balance).toFixed(2);
                setNativeTokenBalance(balance);
            }
        };

        if (blockchainUtil) {
            fetchBalance();
        }
    }, [blockchainUtil, defaultAccount]);

    const handleSwapOfferNavigationButtonClick = (newActiveTab) => {
        if (activeTab === 'createSwapOffer' || activeTab === 'swapOffersList' || activeTab === 'completedSwapsList') {
            setActiveTab(newActiveTab);

            if (newActiveTab === 'createSwapOffer') {
                setActiveSwapOffersListTab(null);
            }
        } else {
            router.push(`/swap?tab=${newActiveTab}`);
        }
    };

    const handleSwapOffersListClick = (item) => {
        if (activeTab === 'createSwapOffer' || activeTab === 'swapOffersList' || activeTab === 'completedSwapsList') {
            setActiveTab('swapOffersList');
            setActiveSwapOffersListTab('yourSwapOffers');
        } else {
            router.push(`/swap?tab=swapOffersList&listTab=yourSwapOffers`);
        }
    };

    const handleSwapOffersListTabClick = (listTab) => {
        if (activeTab === 'createSwapOffer' || activeTab === 'swapOffersList' || activeTab === 'completedSwapsList') {
            setShowSwapOffersHoverMenu(false);
            setActiveTab('swapOffersList');
            setActiveSwapOffersListTab(listTab);
        } else {
            router.push(`/swap?tab=swapOffersList&listTab=${listTab}`);
        }
    };

    const SwapOffersListsButtonWithMenu = () => (
        <RelativePositionContainer onMouseEnter={() => setShowSwapOffersHoverMenu(true)} onMouseLeave={() => setShowSwapOffersHoverMenu(false)}>
            <StyledTabButton isActive={activeTab === 'swapOffersList'} onClick={handleSwapOffersListClick}>
                Swap Offers
            </StyledTabButton>
            <StyledHoverMenu show={showSwapOffersHoverMenu} width='170px'>
                <StyledTabMenuButton isActive={activeSwapOffersListTab === 'yourSwapOffers'} onClick={() => handleSwapOffersListTabClick('yourSwapOffers')}>
                    Your Swap Offers
                </StyledTabMenuButton>
                <StyledTabMenuButton isActive={activeSwapOffersListTab === 'swapOffersForYou'} onClick={() => handleSwapOffersListTabClick('swapOffersForYou')}>
                    Swap Offers for You
                </StyledTabMenuButton>
            </StyledHoverMenu>
        </RelativePositionContainer>
    );

    const SelectNetworkButtonWithMenu = () => {
        const handleNetworkSelect = async (network) => {
            await blockchainUtil?.switchNetwork(network);
            setShowNetworksHoverMenu(false);
        };

        return (
            <RelativePositionContainer onMouseEnter={() => setShowNetworksHoverMenu(true)} onMouseLeave={() => setShowNetworksHoverMenu(false)}>
                <NetworkButton onClick={() => setShowNetworksHoverMenu(!showNetworksHoverMenu)} bgColor={network ? network.color : ''}>
                    <img src={network ? network.logo : ''} alt='' className='network-icon' />
                    {network ? network.uniqueName : 'Select network'}
                </NetworkButton>
                <StyledHoverMenu show={showNetworksHoverMenu} width='240px'>
                    {Object.values(getSupportedNetworks()).map((network) => {
                        return (
                            <SelectNetworkButton key={network.uniqueName} onClick={() => handleNetworkSelect(network)}>
                                <NetworkIcon src={network.logo} alt={`${network.uniqueName} icon`} />
                                {network.uniqueName}
                            </SelectNetworkButton>
                        );
                    })}
                </StyledHoverMenu>
            </RelativePositionContainer>
        );
    };

    const CommonHeaderItems = () => (
        <>
            <StyledTabButton isActive={activeTab === 'createSwapOffer'} onClick={() => handleSwapOfferNavigationButtonClick('createSwapOffer')}>
                Create Swap Offer
            </StyledTabButton>
            <SwapOffersListsButtonWithMenu isActive={activeTab === 'swapOffersList'} onClick={() => setActiveTab('swapOffersList')} />
            <StyledTabButton isActive={activeTab === 'completedSwapsList'} onClick={() => handleSwapOfferNavigationButtonClick('completedSwapsList')}>
                Completed swaps
            </StyledTabButton>
            <Box flexGrow={1} />
            {isMobile && <Box sx={{ borderTop: 1, color: 'white' }} />}
            <SelectNetworkButtonWithMenu />
            {isAccountConnected ? <w3m-button /> : <PrimaryButton onClick={() => open()} buttonText='Connect wallet' />}
        </>
    );

    return (
        <Box sx={{ flexGrow: 1, padding: 0, margin: 0 }}>
            <AppBar position='sticky' elevation={0} component='nav'>
                <StyledToolbar>
                    <Link href='/' passHref>
                        <Card
                            sx={{
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                            }}
                        >
                            <SwappyHome image='/images/swappy_logo.png' />
                        </Card>
                    </Link>
                    {isMobile ? (
                        <>
                            <Box flexGrow={1} />
                            <IconButton edge='start' color='inherit' aria-label='menu' onClick={() => setDrawerOpen(true)}>
                                <MenuIcon />
                            </IconButton>
                            <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiPaper-root': { backgroundColor: '#1B3A47' } }}>
                                <Box sx={{ width: 250, padding: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <CommonHeaderItems />
                                </Box>
                            </Drawer>
                        </>
                    ) : (
                        <CommonHeaderItems />
                    )}
                </StyledToolbar>
            </AppBar>
        </Box>
    );
}

export default Header;
