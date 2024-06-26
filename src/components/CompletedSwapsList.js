import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Paper, TableBody, TableRow, Tooltip, CircularProgress } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import MainContentContainer from './MainContentContainer';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { Truncate } from '../sharedStyles/general';
import SwapOffer from '../utils/swapOffer';
import { sliceAddress } from '../utils/general';
import BorderSection from './BorderSection';
import { StyledTableContainer, StyledTable, StyledTableHead, ClicableTableRow, StyledTableCell, StyledHeaderTableCell, StyledMessage } from '../sharedStyles/tableStyles';


const contractAddresses = require('../contracts/contract-address.json');


function CompletedSwapsList() {
    const { defaultAccount, blockchainUtil } = useWalletConnect();
    const [swapsTakenByUser, setSwapsTakenByUser] = useState([]);
    const [loadingSwaps, setLoadingSwaps] = useState(false);
    const isMobile = useMediaQuery('(max-width:600px)');

    useEffect(() => {
        const fetchUserCompletedSwapsList = async () => {
            const swapOffersTakenByUserHashes = new Set(await blockchainUtil.getSwapOffersTakenByUser(defaultAccount));
            const swaps = [];

            for (const swapOfferHash of swapOffersTakenByUserHashes) {
                const swapOffer = new SwapOffer(blockchainUtil);
                await swapOffer.load(swapOfferHash);

                swapOffer.swaps.map((swap, index) => {
                    if (swap.dstAddress !== defaultAccount) {
                        return;
                    }

                    swaps.push({
                        ...swap,
                        swapOfferHash: swapOffer.hash,
                        userAddress: swap.srcAddress,
                        displayUserAddress: sliceAddress(swapOffer.srcAddress),
                        displayYouSentAmount: swap.dstAmountInBaseUnit,
                        displayYouReceivedAmount: swap.srcAmountInBaseUnit,
                        displayYouSentTokenName: swapOffer.dstTokenSymbol,
                        displayYouReceivedTokenName: swapOffer.getSrcToken().symbol,
                    });
                });
            };

            const userSwapOffersHashes = await blockchainUtil.getUserSwapOffers(defaultAccount);

            await Promise.all(
                userSwapOffersHashes.map(async (hash) => {
                    const swapOffer = new SwapOffer(blockchainUtil);
                    await swapOffer.load(hash);

                    swapOffer.swaps.map((swap, index) => {
                        swaps.push({
                            ...swap,
                            swapOfferHash: swapOffer.hash,
                            userAddress: swap.dstAddress,
                            displayUserAddress: sliceAddress(swap.dstAddress),
                            displayYouSentAmount: swap.srcAmountInBaseUnit,
                            displayYouReceivedAmount: swap.dstAmountInBaseUnit,
                            displayYouSentTokenName: swapOffer.getSrcToken().symbol,
                            displayYouReceivedTokenName: swapOffer.dstTokenSymbol,
                        });
                    });
                })
            );

            swaps.sort((a, b) => b.closedTime - a.closedTime);

            setSwapsTakenByUser(swaps);
            setLoadingSwaps(false);
        };

        if (blockchainUtil) {
            setLoadingSwaps(true);
            fetchUserCompletedSwapsList();
        }
    }, [defaultAccount, blockchainUtil]);

    const handleRowClick = (swapOfferHash) => {
        window.open(`/swap/${swapOfferHash}?network=${blockchainUtil.network.uniqueName}`, '_blank');
    };

    return (
        <MainContentContainer>
            <Box>
                <BorderSection title='Swaps'>
                    <StyledTableContainer component={Paper}>
                        <StyledTable aria-label='simple table'>
                            <StyledTableHead>
                                <TableRow>
                                    {!isMobile && <StyledHeaderTableCell>Time</StyledHeaderTableCell>}
                                    <StyledHeaderTableCell>User</StyledHeaderTableCell>
                                    <StyledHeaderTableCell>You sent</StyledHeaderTableCell>
                                    <StyledHeaderTableCell>You received</StyledHeaderTableCell>
                                </TableRow>
                            </StyledTableHead>
                            <TableBody>
                                {swapsTakenByUser.length === 0 ? (
                                    <TableRow>
                                        <StyledTableCell colSpan={4} style={{ textAlign: 'center' }}>
                                            {loadingSwaps ?
                                                <CircularProgress color='inherit' /> :
                                                <StyledMessage variant='subtitle1'>Nothing to show</StyledMessage>
                                            }
                                        </StyledTableCell>
                                    </TableRow>
                                ) : (swapsTakenByUser.map((swap, index) => {
                                    return (
                                        <ClicableTableRow key={index} onClick={() => handleRowClick(swap.swapOfferHash)}>
                                            {!isMobile && <StyledTableCell align='right'>{swap.displayClosedTime}</StyledTableCell>}
                                            <StyledTableCell align='right'>
                                                <Tooltip title={swap.userAddress}>
                                                    <Truncate>{swap.displayUserAddress}</Truncate>
                                                </Tooltip>
                                            </StyledTableCell>
                                            <StyledTableCell align='right'>
                                                <Tooltip title={swap.displayYouSentAmount}>
                                                    <Truncate>{swap.displayYouSentAmount}</Truncate>
                                                </Tooltip>
                                                {swap.displayYouSentTokenName}
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <Tooltip title={swap.displayYouReceivedAmount}>
                                                    <Truncate>{swap.displayYouReceivedAmount}</Truncate>
                                                </Tooltip>
                                                {swap.displayYouReceivedTokenName}
                                            </StyledTableCell>
                                        </ClicableTableRow>
                                    );
                                })
                            )}
                            </TableBody>
                        </StyledTable>
                    </StyledTableContainer>
                </BorderSection>
            </Box>
        </MainContentContainer>
    );
}

export default CompletedSwapsList;
