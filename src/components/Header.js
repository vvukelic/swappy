import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ethers } from 'ethers';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Card, CardMedia, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import styled from '@emotion/styled';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getNativeTokenBalance, getNetworkName, switchNetwork } from '../utils/web3';
import { sliceAddress } from '../utils/general';
import networks from '../data/networks';
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

const StyledTabButton = styled(Button)`
    margin-left: 10px;
    color: white;
    background-color: ${(props) => (props.isActive ? '#396777' : 'transparent')};
    border: 1px solid transparent;

    &:hover {
        background-color: ${(props) => (props.isActive ? '#396777' : '#396777')};
        border-color: #ffffff;
    }
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

const NetworkButton = styled(Button)`
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

const NativeCoinBalance = styled(Typography)`
    margin-right: 15px;

    @media (max-width: 900px) {
        text-align: center;
        margin-right: 0;
    }
`;

function Header({ activeTab, setActiveTab, activeSwapOffersListTab, setActiveSwapOffersListTab }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [nativeTokenBalance, setNativeTokenBalance] = useState(null);
    const [networkName, setNetworkName] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width:900px)');
    const router = useRouter();
    const [showSwapOffersHoverMenu, setShowSwapOffersHoverMenu] = useState(false);
    const [showNetworksHoverMenu, setShowNetworksHoverMenu] = useState(false);

    useEffect(() => {
        const fetchBalance = async () => {
            if (defaultAccount) {
                let balance = await getNativeTokenBalance(defaultAccount);
                balance = ethers.utils.formatEther(balance);
                balance = parseFloat(balance).toFixed(2);
                setNativeTokenBalance(balance);
            }
        };

        fetchBalance();
    }, [defaultAccount, network]);

    useEffect(() => {
        const updateNetworkName = async () => {
            if (network) {
                const name = await getNetworkName(network);
                setNetworkName(name);
            }
        };

        updateNetworkName();
    }, [network]);

    let connectBtnText = 'Connect';
    if (defaultAccount) {
        connectBtnText = sliceAddress(defaultAccount);
    }

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
                <StyledTabButton isActive={activeSwapOffersListTab === 'yourSwapOffers'} onClick={() => handleSwapOffersListTabClick('yourSwapOffers')}>
                    Your Swap Offers
                </StyledTabButton>
                <StyledTabButton isActive={activeSwapOffersListTab === 'swapOffersForYou'} onClick={() => handleSwapOffersListTabClick('swapOffersForYou')}>
                    Swap Offers for You
                </StyledTabButton>
            </StyledHoverMenu>
        </RelativePositionContainer>
    );

    const SelectNetworkButtonWithMenu = () => {
        const handleNetworkSelect = (networkKey) => {
            switchNetwork(networkKey);
            setShowNetworksHoverMenu(false);
        };

        return (
            <RelativePositionContainer onMouseEnter={() => setShowNetworksHoverMenu(true)} onMouseLeave={() => setShowNetworksHoverMenu(false)}>
                <NetworkButton onClick={() => setShowNetworksHoverMenu(!showNetworksHoverMenu)} bgColor={networkName ? networks[networkName].color : ''}>
                    <img src={networkName ? networks[networkName].logo : ''} alt='' className='network-icon' />
                    {networkName ? networkName : 'Select network'}
                </NetworkButton>
                <StyledHoverMenu show={showNetworksHoverMenu} width='240px'>
                    {Object.keys(networks).map((networkKey) => {
                        const { displayName, logo } = networks[networkKey];
                        return (
                            <SelectNetworkButton key={networkKey} onClick={() => handleNetworkSelect(networkKey)}>
                                <NetworkIcon src={logo} alt={`${displayName} icon`} />
                                {displayName}
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
            <SwapOffersListsButtonWithMenu isActive={activeTab === 'swapOffersList'} onClick={() => setActiveTab('swapOffersList')} onMouseEnter={() => setShowSwapOfferOffersHoverMenu(true)} />
            <StyledTabButton isActive={activeTab === 'completedSwapsList'} onClick={() => handleSwapOfferNavigationButtonClick('completedSwapsList')}>
                Completed swaps
            </StyledTabButton>
            <Box flexGrow={1} />
            {isMobile && <Box sx={{ borderTop: 1, color: 'white' }} />}
            {nativeTokenBalance !== null && (
                <NativeCoinBalance variant='h6' color='white'>
                    {nativeTokenBalance} {networks[networkName].nativeCurrency.symbol}
                </NativeCoinBalance>
            )}
            {/* {network !== null && <NetworkSelector networkName={networkName} sx={{ marginRight: '15px' }} />} */}
            <SelectNetworkButtonWithMenu />
            <PrimaryButton onClick={connectWallet} buttonText={connectBtnText} />
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
                            <CardMedia
                                sx={{
                                    width: '100px',
                                    height: '100px',
                                    backgroundColor: 'transparent',
                                }}
                                image='/images/swappy_logo.png'
                            />
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
