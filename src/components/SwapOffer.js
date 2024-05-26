import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3Modal } from '@web3modal/ethers5/react';
import { Grid, TextField, FormControlLabel, Switch, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SelectTokenModal from './SelectTokenModal';
import SelectToken from './SelectToken';
import MainContentContainer from './MainContentContainer';
import { toSmallestUnit, toBaseUnit, getAllTokens, updateCustomTokensList } from '../utils/tokens';
import { waitForTxToBeMined } from '../utils/general';
import { useWalletConnect } from '../hooks/useWalletConnect';
import styled from '@emotion/styled';
import PrimaryButton from './PrimaryButton';
import InfoModal from './InfoModal';
import useTransactionModal from '../hooks/useTransactionModal';
import TransactionStatusModal from './TransactionStatusModal';
import { useNotification } from './NotificationProvider';
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
    const { defaultAccount, blockchainUtil, isAccountConnected } = useWalletConnect();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [insufficientSrcTokenAmount, setInsufficientSrcTokenAmount] = useState(false);
    const [defaultAccountSrcTokenBalance, setDefaultAccountSrcTokenBalance] = useState(null);
    const { txModalOpen, setTxModalOpen, txStatus, txStatusTxt, txErrorTxt, startTransaction, endTransaction } = useTransactionModal();
    const { addNotification, updateNotification } = useNotification();
    const [wrappedTokenModalMsg, setWrappedTokenModalMsg] = useState('');
    const [showWrappedTokenModal, setShowWrappedTokenModal] = useState(false);
    const [showInvalidAmountsModal, setShowInvalidAmountsModal] = useState(false);
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
        const selectedNetwork = blockchainUtil?.network ? blockchainUtil.network : networks.ethereum;

        if (type === 'src') {
            // let tokenAddress = token.networkSpecificAddress[selectedNetwork.uniqueName];
            let tokenAddress = token.address;

            if (tokenAddress === ethers.constants.AddressZero) {
                tokenAddress = selectedNetwork.wrappedNativeCurrencyAddress;
            }

            if (blockchainUtil && blockchainUtil.network.chainId === token.chainId) {
                const swappyAllowence = await blockchainUtil.getSwappyAllowance(tokenAddress, defaultAccount);
                setTokenApproved(swappyAllowence > 0);
            }

            setSelectedSrcToken(token);
        } else if (type === 'dst') {
            setSelectedDstToken(token);
        }
    };

    useEffect(() => {
        if (blockchainUtil) {
            updateCustomTokensList(blockchainUtil.network.uniqueName);
        }
    }, [blockchainUtil]);

    useEffect(() => {
        if (blockchainUtil?.network) {
            handleTokenSelection(getAllTokens(blockchainUtil.network.uniqueName)[0], 'src');
            handleTokenSelection(getAllTokens(blockchainUtil.network.uniqueName)[1], 'dst');
        } else {
            handleTokenSelection(getAllTokens('ethereum')[0], 'src');
            handleTokenSelection(getAllTokens('ethereum')[1], 'dst');
        }
    }, [blockchainUtil, defaultAccount]);

    useEffect(() => {
        let active = true;

        if (isAccountConnected) {
            if (defaultAccount && selectedSrcToken && defaultAccountSrcTokenBalance) {
                
                if (selectedSrcToken.address) {
                    let srcAmountInt = toSmallestUnit(srcAmount, selectedSrcToken);

                    if (!active) {
                        return;
                    }

                    if (srcAmountInt.lte(defaultAccountSrcTokenBalance)) {
                        setInsufficientSrcTokenAmount(false);

                        if (tokenApproved) {
                            setSwapOfferButtonText('Create Swap Offer');
                        } else {
                            setSwapOfferButtonText(`Approve ${selectedSrcToken.symbol} Token`);
                        }
                    } else {
                        setInsufficientSrcTokenAmount(true);
                        setSwapOfferButtonText(`Insufficient ${selectedSrcToken.symbol} balance`);
                    }
                }
            }
        } else {
            setSwapOfferButtonText('Connect wallet');
            setDefaultAccountSrcTokenBalance(null);
        }

        return () => {
            active = false;
        };
    }, [defaultAccount, selectedSrcToken, tokenApproved, srcAmount, defaultAccountSrcTokenBalance, isAccountConnected]);

    useEffect(() => {
        let active = true;

        async function srcTokenHoldingsAmount() {
            if (selectedSrcToken.address && blockchainUtil.network.chainId === selectedSrcToken.chainId) {
                const tokenBalance = await blockchainUtil.getTokenBalance(defaultAccount, selectedSrcToken.address);

                if (!active) {
                    return;
                }

                setDefaultAccountSrcTokenBalance(tokenBalance);
            }
        };

        if (defaultAccount && selectedSrcToken && blockchainUtil) {
            srcTokenHoldingsAmount();
        }

        return () => {
            active = false;
        };
    }, [defaultAccount, selectedSrcToken, blockchainUtil]);

    async function openSwapOffer() {
         const srcAmountInt = toSmallestUnit(srcAmount, selectedSrcToken);
         const dstAmountInt = toSmallestUnit(dstAmount, selectedDstToken);

         if (srcAmountInt.eq(0) || dstAmountInt.eq(0)) {
            setShowInvalidAmountsModal(true);
            return;
         }

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
             const tx = await blockchainUtil.createSwapOffer(
                selectedSrcToken.address,
                srcAmountInt,
                selectedDstToken.address,
                dstAmountInt,
                dstAddress,
                expiresIn,
                partialFillEnabled
            );

             addNotification(tx.hash, {
                 message: `Creating a swap offer ${selectedSrcToken.symbol} -> ${selectedDstToken.symbol}...`,
                 sevirity: 'info',
                 duration: null,
             });

             const receipt = await waitForTxToBeMined(tx);

             if (receipt.status === 1) {
                 const swapOfferCreatedEvent = receipt.events?.find((e) => e.event === 'SwapOfferCreated');

                 if (swapOfferCreatedEvent) {
                     const swapOfferHash = swapOfferCreatedEvent.args[1];
                     window.location.href = `/swap/${swapOfferHash}?network=${blockchainUtil.network.uniqueName}`;
                     updateNotification(receipt.transactionHash, {
                         message: `Swap offer created!`,
                         severity: 'success',
                         duration: 5000,
                     });
                     endTransaction(true, `You successfuly created a swap offer!`);
                 } else {
                     updateNotification(receipt.transactionHash, {
                         message: `Creating a swap offer ${selectedSrcToken.symbol} -> ${selectedDstToken.symbol} failed!`,
                         severity: 'error',
                         duration: 5000,
                     });
                     endTransaction(false, `Transaction for creating a swap offer failed.`);
                     console.error("Couldn't find SwapCreated event in transaction receipt");
                 }
             } else {
                 updateNotification(receipt.transactionHash, {
                     message: `Creating a swap offer ${selectedSrcToken.symbol} -> ${selectedDstToken.symbol} failed!`,
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
            let tokenAddress = selectedSrcToken.address;

            if (tokenAddress === ethers.constants.AddressZero) {
                // tokenAddress = getTokenByAddress(blockchainUtil.network.wrappedNativeCurrencyAddress, blockchainUtil.network.uniqueName).networkSpecificAddress[blockchainUtil.network.uniqueName];
                tokenAddress = blockchainUtil.network.wrappedNativeCurrencyAddress;
            }

            startTransaction(`Please go to your wallet and approve ${selectedSrcToken.symbol}.`);

            try {
                const tx = await blockchainUtil.approveTokenForSwappy(tokenAddress);

                addNotification(tx.hash, {
                    message: `Approving ${selectedSrcToken.symbol}...`,
                    sevirity: 'info',
                    duration: null,
                });

                const receipt = await waitForTxToBeMined(tx);

                if (receipt.status === 1) {
                    updateNotification(receipt.transactionHash, {
                        message: `${selectedSrcToken.symbol} approved!`,
                        severity: 'success',
                        duration: 5000,
                    });
                    endTransaction(true, `You successfuly approved ${selectedSrcToken.symbol}!`);
                    setTokenApproved(true);
                } else {
                    updateNotification(receipt.transactionHash, {
                        message: `There was an error approving ${selectedSrcToken.symbol}!`,
                        severity: 'error',
                        duration: 5000,
                    });
                    endTransaction(false, `There was an error approving ${selectedSrcToken.symbol}.`);
                }
            } catch (error) {
                endTransaction(false, `There was an error approving ${selectedSrcToken.symbol}.`, error.toString());
                return;
            }
        } else if (!insufficientSrcTokenAmount) {
            if (selectedSrcToken.address === ethers.constants.AddressZero) {
                const nativeTokenSymbol = selectedSrcToken.symbol;
                setWrappedTokenModalMsg(`For this swap offer, your ${nativeTokenSymbol} will be converted to W${nativeTokenSymbol}. Once the offer is accepted, the W${nativeTokenSymbol} will be seamlessly reverted back to ${nativeTokenSymbol} and sent to the swap taker.`);
                setShowWrappedTokenModal(true);
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

        if (!blockchainUtil) {
            return;
        }

        let newSrcTokenAddress = selectedDstToken.address;
        if (newSrcTokenAddress === ethers.constants.AddressZero) {
            newSrcTokenAddress = blockchainUtil.network.wrappedNativeCurrencyAddress;
        }

        const availableTokenBalance = await blockchainUtil.getSwappyAllowance(newSrcTokenAddress, defaultAccount);
        setTokenApproved(availableTokenBalance > 0);
    };

    const handleProceedWithSwap = async () => {
        setShowWrappedTokenModal(false);
        openSwapOffer();
    };

    const handleAbortSwap = () => {
        setShowWrappedTokenModal(false);
    };

    return (
        <>
            <MainContentContainer>
                <SelectToken
                    selectedToken={selectedSrcToken}
                    amount={srcAmount} setAmount={setSrcAmount}
                    selectedTokenImg={selectedSrcTokenImg}
                    labelText='You send' openModal={() => openModal('src')}
                    selectedTokenAccountBalance={defaultAccountSrcTokenBalance && selectedSrcToken ? toBaseUnit(defaultAccountSrcTokenBalance, selectedSrcToken) : null}
                />

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

                <SelectToken
                    selectedToken={selectedDstToken}
                    amount={dstAmount} setAmount={setDstAmount}
                    selectedTokenImg={selectedDstTokenImg}
                    labelText='You receive'
                    openModal={() => openModal('dst')}
                />

                <Grid item xs={12} container alignItems='center' sx={{ color: 'white', padding: '0 16px', marginTop: '20px' }}>
                    <Grid item xs={6} sm={4}>
                        <FormControlLabel
                            control={<StyledSwitch onChange={() => setExpirationEnabled(!expirationEnabled)} checked={expirationEnabled} />}
                            label='Expires In:'
                            sx={{ color: 'white' }}
                        />
                    </Grid>
                    <Grid item xs={3} sm={4}>
                        <TextField
                            label='Hours'
                            variant='outlined'
                            type='number'
                            value={expiresInHours}
                            onChange={(e) => setExpiresInHours(e.target.value)}
                            fullWidth
                            disabled={!expirationEnabled}
                            InputLabelProps={{ style: { color: 'white' } }}
                            inputProps={{ style: { color: 'white' } }}
                        />
                    </Grid>
                    <Grid item xs={3} sm={4}>
                        <TextField 
                            label='Minutes'
                            variant='outlined'
                            type='number'
                            value={expiresInMinutes}
                            onChange={(e) => setExpiresInMinutes(e.target.value)}
                            fullWidth
                            disabled={!expirationEnabled}
                            InputLabelProps={{ style: { color: 'white' } }}
                            inputProps={{ style: { color: 'white' } }}
                        />
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ color: 'white', padding: '0 16px' }}>
                    <TextField
                        label='Destination Address (Optional)'
                        variant='outlined'
                        onChange={(e) => setDstAddress(e.target.value)}
                        fullWidth InputLabelProps={{ style: { color: 'white' } }}
                        inputProps={{ style: { color: 'white' } }}
                    />
                </Grid>

                <Grid item xs={12} container alignItems='center' sx={{ color: 'white', padding: '0 16px' }}>
                    <Grid item xs={12}>
                        <Tooltip title='Enable this option to allow others to partially fulfill your swap offer. This increases the chances of your offer being used, but you may receive multiple smaller transactions instead of a single one.'>
                            <FormControlLabel
                                control={<StyledSwitch onChange={() => setPartialFillEnabled(!partialFillEnabled)} checked={partialFillEnabled} />}
                                label='Allow swap offer to be partially filled'
                                sx={{ color: 'white' }}
                            />
                        </Tooltip>
                    </Grid>
                </Grid>

                <Grid item xs={12} sx={{ padding: '0 16px', marginTop: '20px' }}>
                    <PrimaryButton onClick={handleSwapOfferButtonClick} buttonText={swapOfferButtonText} />
                </Grid>
            </MainContentContainer>

            <SelectTokenModal
                open={modalOpen}
                onClose={closeModal}
                handleTokenSelection={(token) => handleTokenSelection(token, modalType)}
                title={modalType === 'src' ? 'Select a token to send' : 'Select a token to receive'}
                excludeToken={modalType === 'src' ? selectedDstToken : selectedSrcToken}
            />
            <InfoModal open={showWrappedTokenModal} title='Info' msgText={wrappedTokenModalMsg} onOkClose={handleProceedWithSwap} onCancelClose={handleAbortSwap} />
            <InfoModal open={showInvalidAmountsModal} title='Error' msgText='Please insert valid token amounts.' onOkClose={() => setShowInvalidAmountsModal(false)} />
            <TransactionStatusModal open={txModalOpen} status={txStatus} statusTxt={txStatusTxt} errorTxt={txErrorTxt} onClose={() => setTxModalOpen(false)} />
        </>
    );
}

export default SwapOffer;
