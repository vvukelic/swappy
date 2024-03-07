import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { TableBody, TableRow, Paper, Typography } from '@mui/material';
import { StyledTableContainer, StyledTable, StyledTableHead, StyledTableRow, StyledTableCell, StyledHeaderTableCell } from '../sharedStyles/tableStyles';
import { getUserSwapOffers, getSwapOffersForUser } from '../utils/web3';
import BorderedSection from './BorderSection';
import SwapOfferStatusChip from './SwapOfferStatusChip';
import SwapOffer from '../utils/swapOffer';


const contractAddresses = require('../contracts/contract-address.json');


const StyledMessage = styled(Typography)`
    color: white;
    text-align: center;
    margin-top: 20px;
    display: block;
    width: 100%;
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
                                <StyledHeaderTableCell>You send</StyledHeaderTableCell>
                                <StyledHeaderTableCell>You receive</StyledHeaderTableCell>
                                <StyledHeaderTableCell>Status</StyledHeaderTableCell>
                            </TableRow>
                        </StyledTableHead>
                        <TableBody>
                            {swapOffers.length === 0 ? (
                                <TableRow>
                                    <StyledTableCell colSpan={4} style={{ textAlign: 'center' }}>
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
                                    const displayDstTokenName = isSwapOffersForYou ? swapOffer.srcTokenName : swapOffer.dstTokenName;;

                                    return (
                                        <StyledTableRow key={index} onClick={() => handleRowClick(swapOffer.hash)}>
                                            <StyledTableCell align='right'>{swapOffer.displayCreatedTime}</StyledTableCell>
                                            <StyledTableCell align='right'>
                                                {displaySrcAmount} {displaySrcTokenName}
                                            </StyledTableCell>
                                            <StyledTableCell align='right'>
                                                {displayDstAmount} {displayDstTokenName}
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <SwapOfferStatusChip status={swapOffer.readableStatus} />
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
