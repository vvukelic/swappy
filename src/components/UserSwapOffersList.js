import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { TableBody, TableRow, Paper, Tooltip, CircularProgress } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { StyledTableContainer, StyledTable, StyledTableHead, ClicableTableRow, StyledTableCell, StyledHeaderTableCell, StyledMessage } from '../sharedStyles/tableStyles';
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
    const { defaultAccount, blockchainUtil } = useWalletConnect();
    const [userSwapOffers, setUserSwapOffers] = useState([]);
    const [swapOffersForUser, setSwapOffersForUser] = useState([]);
    const [loadingSwapOffers, setLoadingSwapOffers] = useState(false);
    const isMobile = useMediaQuery('(max-width:600px)');

    useEffect(() => {
        const fetchUserSwapOffers = async () => {
            const userSwapOffersHashes = await blockchainUtil.getUserSwapOffers(defaultAccount);

            const userSwapOffers = await Promise.all(
                userSwapOffersHashes.map(async (hash) => {
                    const swapOffer = new SwapOffer(blockchainUtil);
                    await swapOffer.load(hash);
                    return swapOffer;
                })
            );

            userSwapOffers.sort((a, b) => b.createdTime - a.createdTime);
            setUserSwapOffers(userSwapOffers);

            const swapOffersForUserHashes = await blockchainUtil.getSwapOffersForUser(defaultAccount);

            const swapOffersForUser = await Promise.all(
                swapOffersForUserHashes.map(async (hash) => {
                    const swapOffer = new SwapOffer(blockchainUtil);
                    await swapOffer.load(hash);
                    return swapOffer;
                })
            );

            swapOffersForUser.sort((a, b) => b.createdTime - a.createdTime);
            setSwapOffersForUser(swapOffersForUser);

            setLoadingSwapOffers(false);
        };

        const fetchSwapOffersForUser = async () => {

        };

        if (defaultAccount && blockchainUtil) {
            setLoadingSwapOffers(true);
            fetchUserSwapOffers();
            fetchSwapOffersForUser();
        }
    }, [defaultAccount, blockchainUtil]);

    const handleRowClick = (swapOfferHash) => {
        window.open(`/swap/${swapOfferHash}?network=${blockchainUtil.network.uniqueName}`, '_blank');
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
                                            {loadingSwapOffers ?
                                                <CircularProgress color='inherit' /> :
                                                <StyledMessage variant='subtitle1'>Nothing to show</StyledMessage>
                                            }
                                        </StyledTableCell>
                                    </TableRow>
                                ) : (
                                    swapOffers.map((swapOffer, index) => {
                                        const srcAmount = swapOffer.srcAmountInBaseUnit.toString();
                                        const dstAmount = swapOffer.dstAmountInBaseUnit.toString();

                                        const isSwapOffersForYou = activeSwapOffersListTab === 'swapOffersForYou';
                                        const displaySrcAmount = isSwapOffersForYou ? dstAmount : srcAmount;
                                        const displayDstAmount = isSwapOffersForYou ? srcAmount : dstAmount;
                                        const displaySrcTokenName = isSwapOffersForYou ? swapOffer.dstTokenSymbol : swapOffer.getSrcToken().symbol;
                                        const displayDstTokenName = isSwapOffersForYou ? swapOffer.getSrcToken().symbol : swapOffer.dstTokenSymbol;

                                        return (
                                            <ClicableTableRow key={index} onClick={() => handleRowClick(swapOffer.hash)}>
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
                                            </ClicableTableRow>
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
