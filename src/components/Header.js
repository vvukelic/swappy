import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
import { getEthBalance, getNetworkName, switchNetwork } from '../utils/web3';
import { sliceAddress } from '../utils/general';
import networks from '../data/networks';


const RelativePositionContainer = styled.div`
    position: relative;
    display: inline-block;
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
`;

const NetworkButton = styled(Button)`
    margin-left: 10px;
    margin-right: 10px;
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

function Header({ activeTab, setActiveTab, activeSwapsListTab, setActiveSwapsListTab }) {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [ethBalance, setEthBalance] = useState(null);
    const [networkName, setNetworkName] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width:600px)');
    const router = useRouter();
    const [showSwapsHoverMenu, setShowSwapsHoverMenu] = useState(false);
    const [showNetworksHoverMenu, setShowNetworksHoverMenu] = useState(false);

    useEffect(() => {
        const fetchBalance = async () => {
            if (defaultAccount) {
                let balance = await getEthBalance(defaultAccount);
                balance = ethers.utils.formatEther(balance);
                balance = parseFloat(balance).toFixed(2);
                setEthBalance(balance);
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

    const handleSwapNavigationButtonClick = (newActiveTab) => {
        if (activeTab === 'createSwap' || activeTab === 'swapsList') {
            setActiveTab(newActiveTab);

            if (newActiveTab === 'createSwap') {
                setActiveSwapsListTab(null);
            }
        } else {
            router.push(`/swap?tab=${newActiveTab}`);
        }
    };

    const handleSwapsListClick = (item) => {
        if (activeTab === 'createSwap' || activeTab === 'swapsList') {
            setActiveTab('swapsList');
            setActiveSwapsListTab('yourSwaps');
        } else {
            router.push(`/swap?tab=swapsList&listTab=yourSwaps`);
        }
    };

    const handleSwapsListTabClick = (listTab) => {
        if (activeTab === 'createSwap' || activeTab === 'swapsList') {
            setShowSwapsHoverMenu(false);
            setActiveTab('swapsList');
            setActiveSwapsListTab(listTab);
        } else {
            router.push(`/swap?tab=swapsList&listTab=${listTab}`);
        }
    };

    const SwapsListsButtonWithMenu = () => (
        <RelativePositionContainer onMouseEnter={() => setShowSwapsHoverMenu(true)} onMouseLeave={() => setShowSwapsHoverMenu(false)}>
            <StyledTabButton isActive={activeTab === 'swapsList'} onClick={handleSwapsListClick}>
                Swaps
            </StyledTabButton>
            <StyledHoverMenu show={showSwapsHoverMenu} width='170px'>
                <StyledTabButton isActive={activeSwapsListTab === 'yourSwaps'} onClick={() => handleSwapsListTabClick('yourSwaps')}>
                    Your Swaps
                </StyledTabButton>
                <StyledTabButton isActive={activeSwapsListTab === 'swapsForYou'} onClick={() => handleSwapsListTabClick('swapsForYou')}>
                    Swaps for You
                </StyledTabButton>
            </StyledHoverMenu>
        </RelativePositionContainer>
    );

    const SelectNetworkButtonWithMenu = () => {
        const handleNetworkSelect = (networkKey) => {
            switchNetwork(networkKey);
            setShowNetworksHoverMenu(false);
        };

        const networkDetails = networks[networkName] || null;

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
            <StyledTabButton isActive={activeTab === 'createSwap'} onClick={() => handleSwapNavigationButtonClick('createSwap')}>
                Create Swap
            </StyledTabButton>
            <SwapsListsButtonWithMenu isActive={activeTab === 'swapsList'} onClick={() => setActiveTab('swapsList')} onMouseEnter={() => setShowSwapsHoverMenu(true)}>
                Swaps List
            </SwapsListsButtonWithMenu>
            <Box flexGrow={1} />
            {ethBalance !== null && (
                <Typography sx={{ marginRight: '15px' }} variant='h6' color='white'>
                    {ethBalance} ETH
                </Typography>
            )}
            {/* {network !== null && <NetworkSelector networkName={networkName} sx={{ marginRight: '15px' }} />} */}
            <SelectNetworkButtonWithMenu />
            <Button onClick={connectWallet} sx={{ backgroundColor: '#F7B93E', '&:hover': { backgroundColor: '#FFD684' }, color: 'black' }}>
                {connectBtnText}
            </Button>
        </>
    );

    return (
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
                                    <CommonHeaderItems />
                                </Box>
                            </Drawer>
                        </>
                    ) : (
                        <CommonHeaderItems />
                    )}
                </Toolbar>
            </AppBar>
        </Box>
    );
}

export default Header;
