import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Paper, TableBody, TableRow, Tooltip } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import MainContentContainer from './MainContentContainer';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { getUserSwapOffers, getSwapOffersTakenByUser } from '../utils/web3';
import { Truncate } from '../sharedStyles/general';
import SwapOffer from '../utils/swapOffer';
import { sliceAddress } from '../utils/general';
import BorderSection from './BorderSection';
import { StyledTableContainer, StyledTable, StyledTableHead, StyledTableRow, StyledTableCell, StyledHeaderTableCell, StyledMessage } from '../sharedStyles/tableStyles';


const contractAddresses = require('../contracts/contract-address.json');


function CompletedSwapsList() {
    const { defaultAccount, connectWallet, network } = useWalletConnect();
    const [swapsTakenByUser, setSwapsTakenByUser] = useState([]);
    const isMobile = useMediaQuery('(max-width:600px)');

    useEffect(() => {
        const fetchUserCompletedSwapsList = async () => {
            const swapOffersTakenByUserHashes = await getSwapOffersTakenByUser(contractAddresses.SwapManager[network], defaultAccount);
            const swaps = [];

            for (let i = 0; i < swapOffersTakenByUserHashes.length; i++) {
                const swapOffer = new SwapOffer(network);
                await swapOffer.load(swapOffersTakenByUserHashes[i]);

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
                        displayYouSentTokenName: swapOffer.dstTokenName,
                        displayYouReceivedTokenName: swapOffer.srcTokenName,
                    });
                });
            }

            const userSwapOffersHashes = await getUserSwapOffers(contractAddresses.SwapManager[network], defaultAccount);

            await Promise.all(
                userSwapOffersHashes.map(async (hash) => {
                    const swapOffer = new SwapOffer(network);
                    await swapOffer.load(hash);

                    swapOffer.swaps.map((swap, index) => {
                        swaps.push({
                            ...swap,
                            swapOfferHash: swapOffer.hash,
                            userAddress: swap.dstAddress,
                            displayUserAddress: sliceAddress(swap.dstAddress),
                            displayYouSentAmount: swap.srcAmountInBaseUnit,
                            displayYouReceivedAmount: swap.dstAmountInBaseUnit,
                            displayYouSentTokenName: swapOffer.srcTokenName,
                            displayYouReceivedTokenName: swapOffer.dstTokenName,
                        });
                    });
                })
            );

            swaps.sort((a, b) => b.closedTime - a.closedTime);

            setSwapsTakenByUser(swaps);
        };

        fetchUserCompletedSwapsList();
    }, [defaultAccount, network]);

    const handleRowClick = (swapOfferHash) => {
        window.open(`/swap/${swapOfferHash}`, '_blank');
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
                                            <StyledMessage variant='subtitle1'>Nothing to show</StyledMessage>
                                        </StyledTableCell>
                                    </TableRow>
                                ) : (swapsTakenByUser.map((swap, index) => {
                                    return (
                                        <StyledTableRow key={index} onClick={() => handleRowClick(swap.swapOfferHash)}>
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
                                        </StyledTableRow>
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
