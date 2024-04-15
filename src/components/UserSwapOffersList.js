import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { TableBody, TableRow, Paper, Tooltip } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { StyledTableContainer, StyledTable, StyledTableHead, StyledTableRow, StyledTableCell, StyledHeaderTableCell, StyledMessage } from '../sharedStyles/tableStyles';
import BorderedSection from './BorderSection';
import SwapOfferStatusChip from './SwapOfferStatusChip';
import SwapOffer from '../utils/swapOffer';
import SwapOfferPercentageFilledLabel from './SwapOfferPercentageFilledLabel';
import MainContentContainer from './MainContentContainer';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { Truncate } from '../sharedStyles/general';


const StyledStatusTableCell = styled(StyledTableCell)`
    padding: 0;
`;

const UserSwapOffersList = ({ activeSwapOffersListTab }) => {
    const { defaultAccount, network, blockchainUtil, isAccountConnected } = useWalletConnect();
    const [userSwapOffers, setUserSwapOffers] = useState([]);
    const [swapOffersForUser, setSwapOffersForUser] = useState([]);
    const isMobile = useMediaQuery('(max-width:600px)');

    useEffect(() => {
        const fetchUserSwapOffers = async () => {
            const swapOffersHashes = await blockchainUtil.getUserSwapOffers(defaultAccount);

            const swapOffers = await Promise.all(
                swapOffersHashes.map(async (hash) => {
                    const swapOffer = new SwapOffer(blockchainUtil);
                    await swapOffer.load(hash);
                    return swapOffer;
                })
            );

            swapOffers.sort((a, b) => b.createdTime - a.createdTime);
            setUserSwapOffers(swapOffers);
        };

        const fetchSwapOffersForUser = async () => {
            const swapOffersHashes = await blockchainUtil.getSwapOffersForUser(defaultAccount);

            const swapOffers = await Promise.all(
                swapOffersHashes.map(async (hash) => {
                    const swapOffer = new SwapOffer(blockchainUtil);
                    await swapOffer.load(hash);
                    return swapOffer;
                })
            );

            swapOffers.sort((a, b) => b.createdTime - a.createdTime);
            setSwapOffersForUser(swapOffers);
        };

        if (defaultAccount && network && blockchainUtil) {
            fetchUserSwapOffers();
            fetchSwapOffersForUser();
        }
    }, [defaultAccount, network, blockchainUtil]);

    const handleRowClick = (swapOfferHash) => {
        window.open(`/swap/${swapOfferHash}`, '_blank');
    };

    const renderSwapOffersTable = (swapOffers, tableTitle) => {
        return (
            <MainContentContainer>
                <BorderedSection title={tableTitle}>
                    <StyledTableContainer component={Paper}>
                        <StyledTable aria-label='simple table'>
                            <StyledTableHead>
                                <TableRow>
                                    {!isMobile && <StyledHeaderTableCell>Created at</StyledHeaderTableCell>}
                                    <StyledHeaderTableCell>Send</StyledHeaderTableCell>
                                    <StyledHeaderTableCell>Receive</StyledHeaderTableCell>
                                    <StyledHeaderTableCell>Status</StyledHeaderTableCell>
                                    <StyledHeaderTableCell>{isMobile ? '%' : 'Filled %'}</StyledHeaderTableCell>
                                </TableRow>
                            </StyledTableHead>
                            <TableBody>
                                {swapOffers.length === 0 ? (
                                    <TableRow>
                                        <StyledTableCell colSpan={isMobile ? 4 : 5} style={{ textAlign: 'center' }}>
                                            <StyledMessage variant='subtitle1'>Nothing to show</StyledMessage>
                                        </StyledTableCell>
                                    </TableRow>
                                ) : (
                                    swapOffers.map((swapOffer, index) => {
                                        const srcAmount = swapOffer.srcAmountInBaseUnit.toString();
                                        const dstAmount = swapOffer.dstAmountInBaseUnit.toString();

                                        const isSwapOffersForYou = activeSwapOffersListTab === 'swapOffersForYou';
                                        const displaySrcAmount = isSwapOffersForYou ? dstAmount : srcAmount;
                                        const displayDstAmount = isSwapOffersForYou ? srcAmount : dstAmount;
                                        const displaySrcTokenName = isSwapOffersForYou ? swapOffer.dstTokenName : swapOffer.srcTokenName;
                                        const displayDstTokenName = isSwapOffersForYou ? swapOffer.srcTokenName : swapOffer.dstTokenName;

                                        return (
                                            <StyledTableRow key={index} onClick={() => handleRowClick(swapOffer.hash)}>
                                                {!isMobile && <StyledTableCell align='right'>{swapOffer.displayCreatedTime}</StyledTableCell>}
                                                <StyledTableCell align='right'>
                                                    <Tooltip title={displaySrcAmount}>
                                                        <Truncate>{displaySrcAmount}</Truncate>
                                                    </Tooltip>
                                                    {displaySrcTokenName}
                                                </StyledTableCell>
                                                <StyledTableCell align='right'>
                                                    <Tooltip title={displayDstAmount}>
                                                        <Truncate>{displayDstAmount}</Truncate>
                                                    </Tooltip>
                                                    {displayDstTokenName}
                                                </StyledTableCell>
                                                <StyledStatusTableCell>
                                                    <SwapOfferStatusChip status={swapOffer.readableStatus} isMobile={isMobile} />
                                                </StyledStatusTableCell>
                                                <StyledTableCell>
                                                    <SwapOfferPercentageFilledLabel percentage={swapOffer.filledPercentage} />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </StyledTable>
                    </StyledTableContainer>
                </BorderedSection>
            </MainContentContainer>
        );
    };


    return (
        <div>
            {activeSwapOffersListTab === 'yourSwapOffers' && renderSwapOffersTable(userSwapOffers, 'Your swap offers')}
            {activeSwapOffersListTab === 'swapOffersForYou' && renderSwapOffersTable(swapOffersForUser, 'Swap offers for you')}
        </div>
    );
};

export default UserSwapOffersList;
