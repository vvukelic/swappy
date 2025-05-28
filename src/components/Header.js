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
import { RelativePositionContainer, SwappyHome, StyledTabButton, DropdownHoverMenu, DropdownHoverMenuButton } from '../sharedStyles/general';
import PrimaryButton from './PrimaryButton';
import { useNetworkWithoutWallet } from '../context/NetworkWithoutWallet';


const StyledToolbar = styled(Toolbar)`
    background-color: #1b2a47;
    justify-content: center;
    @media (max-width: 900px) {
        justify-content: space-between;
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

function Header({ activeTab, setActiveTab, activeSwapOffersListTab, setActiveSwapOffersListTab }) {
    const { defaultAccount, blockchainUtil, isAccountConnected } = useWalletConnect();
    const [nativeTokenBalance, setNativeTokenBalance] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width:900px)');
    const router = useRouter();
    const [showSwapOffersHoverMenu, setShowSwapOffersHoverMenu] = useState(false);
    const [showNetworksHoverMenu, setShowNetworksHoverMenu] = useState(false);
    const { networkWithoutWallet, setNetworkWithoutWallet } = useNetworkWithoutWallet();
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
            <DropdownHoverMenu show={showSwapOffersHoverMenu} width='170px'>
                <DropdownHoverMenuButton isActive={activeSwapOffersListTab === 'yourSwapOffers'} onClick={() => handleSwapOffersListTabClick('yourSwapOffers')}>
                    Your Swap Offers
                </DropdownHoverMenuButton>
                <DropdownHoverMenuButton isActive={activeSwapOffersListTab === 'swapOffersForYou'} onClick={() => handleSwapOffersListTabClick('swapOffersForYou')}>
                    Swap Offers for You
                </DropdownHoverMenuButton>
            </DropdownHoverMenu>
        </RelativePositionContainer>
    );

    const SelectNetworkButtonWithMenu = () => {
        const handleNetworkSelect = async (network) => {
            await blockchainUtil?.switchNetwork(network);
            setNetworkWithoutWallet(network);
            setShowNetworksHoverMenu(false);
        };

        const currentNetwork = blockchainUtil?.network ? blockchainUtil.network : networkWithoutWallet;

        return (
            <RelativePositionContainer onMouseEnter={() => setShowNetworksHoverMenu(true)} onMouseLeave={() => setShowNetworksHoverMenu(false)}>
                <NetworkButton onClick={() => setShowNetworksHoverMenu(!showNetworksHoverMenu)} bgColor={currentNetwork?.color || 'black'}>
                    <img src={currentNetwork?.logo} alt='' className='network-icon' />
                    {currentNetwork?.uniqueName}
                </NetworkButton>
                <DropdownHoverMenu show={showNetworksHoverMenu} width='240px'>
                    {Object.values(getSupportedNetworks()).map((network) => {
                        return (
                            <SelectNetworkButton key={network.uniqueName} onClick={() => handleNetworkSelect(network)}>
                                <NetworkIcon src={network.logo} alt={`${network.uniqueName} icon`} />
                                {network.uniqueName}
                            </SelectNetworkButton>
                        );
                    })}
                </DropdownHoverMenu>
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
                                padding: '0.5em',
                            }}
                        >
                            <SwappyHome image='/images/swappy-head-1.svg' />
                        </Card>
                    </Link>
                    {isMobile ? (
                        <>
                            <Box flexGrow={1} />
                            <IconButton edge='start' color='inherit' aria-label='menu' onClick={() => setDrawerOpen(true)}>
                                <MenuIcon />
                            </IconButton>
                            <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiPaper-root': { backgroundColor: '#1b2a47' } }}>
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
