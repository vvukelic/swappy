import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { TableBody, TableRow, Paper, Tooltip } from '@mui/material';
import { StyledTableContainer, StyledTable, StyledTableHead, StyledTableRow, StyledTableCell, StyledHeaderTableCell, StyledMessage } from '../sharedStyles/tableStyles';
import { getUserSwapOffers, getSwapOffersForUser } from '../utils/web3';
import BorderedSection from './BorderSection';
import SwapOfferStatusChip from './SwapOfferStatusChip';
import SwapOffer from '../utils/swapOffer';
import SwapOfferPercentageFilledLabel from './SwapOfferPercentageFilledLabel';
import Truncate from '../sharedStyles/general';


const contractAddresses = require('../contracts/contract-address.json');


const StyledStatusTableCell = styled(StyledTableCell)`
    padding: 0;
`;

const UserSwapOffersList = ({ userAddress, network, activeSwapOffersListTab }) => {
    const [userSwapOffers, setUserSwapOffers] = useState([]);
    const [swapOffersForUser, setSwapOffersForUser] = useState([]);

    useEffect(() => {
        const fetchUserSwapOffers = async () => {
            const swapOffersHashes = await getUserSwapOffers(contractAddresses.SwapManager[network], userAddress);

            const swapsWithHash = await Promise.all(
                swapOffersHashes.map(async (hash) => {
                    const swapOffer = new SwapOffer(network);
                    await swapOffer.load(hash);
                    return swapOffer;
                })
            );
            setUserSwapOffers(swapsWithHash);
        };

        const fetchSwapOffersForUser = async () => {
            const swapOffersHashes = await getSwapOffersForUser(contractAddresses.SwapManager[network], userAddress);
            const swapsWithHash = await Promise.all(
                swapOffersHashes.map(async (hash) => {
                    const swapOffer = new SwapOffer(network);
                    await swapOffer.load(hash);
                    return swapOffer;
                })
            );
            setSwapOffersForUser(swapsWithHash);
        };

        fetchUserSwapOffers();
        fetchSwapOffersForUser();
    }, [userAddress, network]);

    const handleRowClick = (swapOfferHash) => {
        window.open(`/swap/${swapOfferHash}`, '_blank');
    };

    const renderSwapOffersTable = (swapOffers, tableTitle) => {
        return (
            <BorderedSection title={tableTitle}>
                <StyledTableContainer component={Paper}>
                    <StyledTable aria-label='simple table'>
                        <StyledTableHead>
                            <TableRow>
                                <StyledHeaderTableCell>Created at</StyledHeaderTableCell>
                                <StyledHeaderTableCell>Send</StyledHeaderTableCell>
                                <StyledHeaderTableCell>Receive</StyledHeaderTableCell>
                                <StyledHeaderTableCell>Status</StyledHeaderTableCell>
                                <StyledHeaderTableCell>Filled %</StyledHeaderTableCell>
                            </TableRow>
                        </StyledTableHead>
                        <TableBody>
                            {swapOffers.length === 0 ? (
                                <TableRow>
                                    <StyledTableCell colSpan={5} style={{ textAlign: 'center' }}>
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
                                            <StyledTableCell align='right'>{swapOffer.displayCreatedTime}</StyledTableCell>
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
                                                <SwapOfferStatusChip status={swapOffer.readableStatus} />
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
