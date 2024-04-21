import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3Modal } from '@web3modal/ethers5/react';
import { Grid, TextField, FormControlLabel, Switch, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SelectTokenModal from './SelectTokenModal';
import SelectToken from './SelectToken';
import MainContentContainer from './MainContentContainer';
import { getTokenByAddress, updateCustomTokensList, getNativeToken } from '../utils/tokens';
import { waitForTxToBeMined } from '../utils/general';
import { useWalletConnect } from '../hooks/useWalletConnect';
import styled from '@emotion/styled';
import PrimaryButton from './PrimaryButton';
import InfoModal from './InfoModal';
import useTransactionModal from '../hooks/useTransactionModal';
import TransactionStatusModal from './TransactionStatusModal';
import { useNotification } from './NotificationProvider';
import commonTokens from '../data/commonTokens.json';
import networks from '../data/networks';


const StyledSwitch = styled(Switch)`
    & .MuiSwitch-switchBase.Mui-checked {
        color: white;
        &:hover {
            background-color: rgba(255, 255, 255, 0.08);
        }
    }
    & .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
        background-color: white;
    }
`;

function SwapOffer({ 
    srcAmount,
    setSrcAmount,
    dstAmount,
    setDstAmount,
    dstAddress,
    setDstAddress,
    selectedSrcToken,
    setSelectedSrcToken,
    selectedDstToken,
    setSelectedDstToken,
    swapOfferButtonText, 
    setSwapOfferButtonText,
    tokenApproved,
    setTokenApproved,
    expiresInHours,
    setExpiresInHours,
    expiresInMinutes,
    setExpiresInMinutes,
    expirationEnabled,
    setExpirationEnabled,
    partialFillEnabled,
    setPartialFillEnabled,
    selectedSrcTokenImg,
    selectedDstTokenImg
}) {
    const { defaultAccount, network, blockchainUtil, isAccountConnected } = useWalletConnect();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [insufficientSrcTokenAmount, setInsufficientSrcTokenAmount] = useState(false);
    const [defaultAccountSrcTokenBalance, setDefaultAccountSrcTokenBalance] = useState(null);
    const [selectedSrcTokenDecimals, setSelectedSrcTokenDecimals] = useState(0);
    const [selectedDstTokenDecimals, setSelectedDstTokenDecimals] = useState(0);
    const { txModalOpen, setTxModalOpen, txStatus, txStatusTxt, txErrorTxt, startTransaction, endTransaction } = useTransactionModal();
    const { addNotification, updateNotification } = useNotification();
    const [infoModalMsg, setInfoModalMsg] = useState('');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const { open } = useWeb3Modal();

    const openModal = (type) => {
        setModalType(type);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalType(null);
        setModalOpen(false);
    };

    const handleTokenSelection = async (token, type) => {
        const selectedNetwork = network ? network : networks.ethereum;

        if (type === 'src') {
            if (token === selectedSrcToken) {
                return;
            }

            let tokenAddress = token.networkSpecificAddress[selectedNetwork.uniqueName];

            if (tokenAddress === ethers.constants.AddressZero) {
                tokenAddress = getTokenByAddress(selectedNetwork.wrappedNativeCurrencyAddress, selectedNetwork.uniqueName).networkSpecificAddress[selectedNetwork.uniqueName];
            }

            if (blockchainUtil) {
                const availableTokenBalance = await blockchainUtil.getSwappyAllowance(tokenAddress, defaultAccount);
                setTokenApproved(availableTokenBalance > 0);
            }

            setSelectedSrcToken(token);
        } else if (type === 'dst') {
            setSelectedDstToken(token);
        }
    };

    useEffect(() => {
        updateCustomTokensList();
    }, []);

    useEffect(() => {
        if (!isAccountConnected) {
            setSwapOfferButtonText('Connect wallet');
            setDefaultAccountSrcTokenBalance(null);
        }
    }, [isAccountConnected]);

    useEffect(() => {
        if (network) {
            handleTokenSelection(getNativeToken(network.uniqueName), 'src');
        } else {
            handleTokenSelection(commonTokens[0], 'src'); // ETH
        }

        handleTokenSelection(commonTokens[1], 'dst');  // USDC
    }, [network, blockchainUtil]);

    useEffect(() => {
        async function swapOfferButtonText() {
            const tokenAddress = selectedSrcToken.networkSpecificAddress[network.uniqueName];

            if (tokenAddress) {
                const defaultAccountSrcTokenBalance = await blockchainUtil.getTokenBalance(defaultAccount, tokenAddress);
                const srcAmountInt = await blockchainUtil.toSmallestUnit(srcAmount, tokenAddress);

                if (srcAmountInt.lte(defaultAccountSrcTokenBalance)) {
                    setInsufficientSrcTokenAmount(false);

                    if (tokenApproved) {
                        setSwapOfferButtonText('Create Swap Offer');
                    } else {
                        setSwapOfferButtonText(`Approve ${selectedSrcToken.name} Token`);
                    }
                } else {
                    setInsufficientSrcTokenAmount(true);
                    setSwapOfferButtonText(`Insufficient ${selectedSrcToken.name} balance`);
                }
            }
        }

        if (defaultAccount && selectedSrcToken && blockchainUtil) {
            swapOfferButtonText();
        }
    }, [network, blockchainUtil, selectedSrcToken, tokenApproved, srcAmount, isAccountConnected]);

    useEffect(() => {
        async function srcTokenHoldingsAmount() {
            const tokenContract = selectedSrcToken.networkSpecificAddress[network.uniqueName];

            if (tokenContract) {
                const tokenBalance = await blockchainUtil.getTokenBalance(defaultAccount, tokenContract);
                setDefaultAccountSrcTokenBalance(await blockchainUtil.toBaseUnit(tokenBalance, tokenContract));
            }
        };

        async function getSrcTokenDecimals() {
            const tokenAddress = selectedSrcToken.networkSpecificAddress[network.uniqueName];

            if (tokenAddress) {
                const srcTokenDecimals = tokenAddress === ethers.constants.AddressZero ? 18 : await blockchainUtil.getTokenDecimals(tokenAddress);
                setSelectedSrcTokenDecimals(srcTokenDecimals);
            }
        };

        if (defaultAccount && selectedSrcToken && network && blockchainUtil) {
            srcTokenHoldingsAmount();
            getSrcTokenDecimals();
        }
    }, [network, defaultAccount, selectedSrcToken, blockchainUtil]);

    useEffect(() => {
        async function getDstTokenDecimals() {
            const tokenAddress = selectedDstToken.networkSpecificAddress[network.uniqueName];

            if (tokenAddress) {
                const dstTokenDecimals = tokenAddress === ethers.constants.AddressZero ? 18 : await blockchainUtil.getTokenDecimals(tokenAddress);
                setSelectedDstTokenDecimals(dstTokenDecimals);
            }
        }

        if (defaultAccount && selectedDstToken && network && blockchainUtil) {
            getDstTokenDecimals();
        }
    }, [network, defaultAccount, selectedDstToken]);

    async function openSwapOffer() {
         const srcAmountInt = await blockchainUtil.toSmallestUnit(srcAmount, selectedSrcToken.networkSpecificAddress[network.uniqueName]);
         const dstAmountInt = await blockchainUtil.toSmallestUnit(dstAmount, selectedDstToken.networkSpecificAddress[network.uniqueName]);

         let expiresIn = 0;
         if (expirationEnabled) {
             expiresIn = parseInt(expiresInHours) * 60 * 60 + parseInt(expiresInMinutes) * 60;
         }

         let _dstAddress = dstAddress;
         if (!_dstAddress) {
             _dstAddress = ethers.constants.AddressZero;
         }

         startTransaction('Please go to your wallet and confirm the transaction for the swap offer.');

         try {
             const tx = await blockchainUtil.createSwapOffer(selectedSrcToken.networkSpecificAddress[network.uniqueName], srcAmountInt, selectedDstToken.networkSpecificAddress[network.uniqueName], dstAmountInt, dstAddress, expiresIn, partialFillEnabled);

             addNotification(tx.hash, {
                 message: `Creating a swap offer ${selectedSrcToken.name.toUpperCase()} -> ${selectedDstToken.name.toUpperCase()}...`,
                 sevirity: 'info',
                 duration: null,
             });

             const receipt = await waitForTxToBeMined(tx);

             if (receipt.status === 1) {
                 const swapOfferCreatedEvent = receipt.events?.find((e) => e.event === 'SwapOfferCreated');

                 if (swapOfferCreatedEvent) {
                     const swapOfferHash = swapOfferCreatedEvent.args[1];
                     window.location.href = `/swap/${swapOfferHash}?network=${network.uniqueName}`;
                     updateNotification(receipt.transactionHash, {
                         message: `Swap offer created!`,
                         severity: 'success',
                         duration: 5000,
                     });
                     endTransaction(true, `You successfuly created a swap offer!`);
                 } else {
                     updateNotification(receipt.transactionHash, {
                         message: `Creating a swap offer ${selectedSrcToken.name.toUpperCase()} -> ${selectedDstToken.name.toUpperCase()} failed!`,
                         severity: 'error',
                         duration: 5000,
                     });
                     endTransaction(false, `Transaction for creating a swap offer failed.`);
                     console.error("Couldn't find SwapCreated event in transaction receipt");
                 }
             } else {
                 updateNotification(receipt.transactionHash, {
                     message: `Creating a swap offer ${selectedSrcToken.name.toUpperCase()} -> ${selectedDstToken.name.toUpperCase()} failed!`,
                     severity: 'error',
                     duration: 5000,
                 });
                 endTransaction(false, `Transaction for creating a swap offer failed.`);
             }
         } catch (error) {
             console.error(error);
             endTransaction(false, 'Transaction for creating a swap offer failed.', error.toString());
         }
    }

    const handleSwapOfferButtonClick = async () => {
        if (!isAccountConnected) {
            open();
        } else if (!tokenApproved && !insufficientSrcTokenAmount) {
            let tokenAddress = selectedSrcToken.networkSpecificAddress[network.uniqueName];

            if (tokenAddress === ethers.constants.AddressZero) {
                tokenAddress = getTokenByAddress(network.wrappedNativeCurrencyAddress, network.uniqueName).networkSpecificAddress[network.uniqueName];
            }

            startTransaction(`Please go to your wallet and approve ${selectedSrcToken.name.toUpperCase()}.`);

            try {
                const tx = await blockchainUtil.approveTokenForSwappy(tokenAddress);

                addNotification(tx.hash, {
                    message: `Approving ${selectedSrcToken.name.toUpperCase()}...`,
                    sevirity: 'info',
                    duration: null,
                });

                const receipt = await waitForTxToBeMined(tx);

                if (receipt.status === 1) {
                    updateNotification(receipt.transactionHash, {
                        message: `${selectedSrcToken.name.toUpperCase()} approved!`,
                        severity: 'success',
                        duration: 5000,
                    });
                    endTransaction(true, `You successfuly approved ${selectedSrcToken.name.toUpperCase()}!`);
                    setTokenApproved(true);
                } else {
                    updateNotification(receipt.transactionHash, {
                        message: `There was an error approving ${selectedSrcToken.name.toUpperCase()}!`,
                        severity: 'error',
                        duration: 5000,
                    });
                    endTransaction(false, `There was an error approving ${selectedSrcToken.name.toUpperCase()}.`);
                }
            } catch (error) {
                endTransaction(false, `There was an error approving ${selectedSrcToken.name.toUpperCase()}.`, error.toString());
                return;
            }
        } else if (!insufficientSrcTokenAmount) {
            if (selectedSrcToken.networkSpecificAddress[network.uniqueName] === ethers.constants.AddressZero) {
                const nativeTokenName = selectedSrcToken.name.toUpperCase();
                setInfoModalMsg(`For this swap offer, your ${nativeTokenName} will be converted to W${nativeTokenName}. Once the offer is accepted, the W${nativeTokenName} will be seamlessly reverted back to ${nativeTokenName} and sent to the swap taker.`);
                setShowInfoModal(true);
            } else {
                openSwapOffer();
            }
        }
    };

    const handleSwitchTokensButtonClick = async () => {
        // Swap tokens
        const tempToken = selectedSrcToken;
        setSelectedSrcToken(selectedDstToken);
        setSelectedDstToken(tempToken);

        // Swap amounts
        const tempAmount = srcAmount;
        setSrcAmount(dstAmount);
        setDstAmount(tempAmount);

        let newSrcTokenAddress = selectedDstToken.networkSpecificAddress[network.uniqueName];
        if (newSrcTokenAddress === ethers.constants.AddressZero) {
            newSrcTokenAddress = getTokenByAddress(network.wrappedNativeCurrencyAddress, network.uniqueName).networkSpecificAddress[network.uniqueName];
        }

        const availableTokenBalance = await blockchainUtil.getSwappyAllowance(newSrcTokenAddress, defaultAccount);
        setTokenApproved(availableTokenBalance > 0);
    };

    const handleProceedWithSwap = async () => {
        setShowInfoModal(false);
        openSwapOffer();
    };

    const handleAbortSwap = () => {
        setShowInfoModal(false);
    };

    return (
        <>
            <MainContentContainer>
                <SelectToken selectedToken={selectedSrcToken} selectedTokenDecimals={selectedSrcTokenDecimals} amount={srcAmount} setAmount={setSrcAmount} selectedTokenImg={selectedSrcTokenImg} labelText='You send' openModal={() => openModal('src')} selectedTokenAccountBalance={defaultAccountSrcTokenBalance} />

                <Grid item xs={12} container justifyContent='center' alignItems='center' sx={{ padding: '0 !important' }}>
                    <IconButton
                        variant='outlined'
                        onClick={handleSwitchTokensButtonClick}
                        style={{
                            transition: 'transform 0.3s ease-in-out',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'rotate(180deg)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'rotate(0deg)';
                        }}
                    >
                        <ArrowDownwardIcon />
                    </IconButton>
                </Grid>

                <SelectToken selectedToken={selectedDstToken} selectedTokenDecimals={selectedDstTokenDecimals} amount={dstAmount} setAmount={setDstAmount} selectedTokenImg={selectedDstTokenImg} labelText='You receive' openModal={() => openModal('dst')} />

                <Grid item xs={12} container alignItems='center' sx={{ color: 'white', padding: '0 16px', marginTop: '20px' }}>
                    <Grid item xs={6} sm={4}>
                        <FormControlLabel control={<StyledSwitch onChange={() => setExpirationEnabled(!expirationEnabled)} checked={expirationEnabled} />} label='Expires In:' sx={{ color: 'white' }} />
                    </Grid>
                    <Grid item xs={3} sm={4}>
                        <TextField label='Hours' variant='outlined' type='number' value={expiresInHours} onChange={(e) => setExpiresInHours(e.target.value)} fullWidth disabled={!expirationEnabled} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                    </Grid>
                    <Grid item xs={3} sm={4}>
                        <TextField label='Minutes' variant='outlined' type='number' value={expiresInMinutes} onChange={(e) => setExpiresInMinutes(e.target.value)} fullWidth disabled={!expirationEnabled} InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ color: 'white', padding: '0 16px' }}>
                    <TextField label='Destination Address (Optional)' variant='outlined' onChange={(e) => setDstAddress(e.target.value)} fullWidth InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
                </Grid>

                <Grid item xs={12} container alignItems='center' sx={{ color: 'white', padding: '0 16px' }}>
                    <Grid item xs={12}>
                        <Tooltip title='Enable this option to allow others to partially fulfill your swap offer. This increases the chances of your offer being used, but you may receive multiple smaller transactions instead of a single one.'>
                            <FormControlLabel control={<StyledSwitch onChange={() => setPartialFillEnabled(!partialFillEnabled)} checked={partialFillEnabled} />} label='Allow swap offer to be partially filled' sx={{ color: 'white' }} />
                        </Tooltip>
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                    <PrimaryButton onClick={handleSwapOfferButtonClick} buttonText={swapOfferButtonText} />
                </Grid>
            </MainContentContainer>

            <SelectTokenModal open={modalOpen} onClose={closeModal} handleTokenSelection={(token) => handleTokenSelection(token, modalType)} title={modalType === 'src' ? 'Select a token to send' : 'Select a token to receive'} />
            <InfoModal open={showInfoModal} msgText={infoModalMsg} onOkClose={handleProceedWithSwap} onCancelClose={handleAbortSwap} />
            <TransactionStatusModal open={txModalOpen} status={txStatus} statusTxt={txStatusTxt} errorTxt={txErrorTxt} onClose={() => setTxModalOpen(false)} />
        </>
    );
}

export default SwapOffer;
