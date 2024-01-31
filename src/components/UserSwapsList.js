import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Chip } from '@mui/material';
import { getUserSwaps, getDstUserSwaps, getSwap, getCurrentBlockTimestamp } from '../utils/web3';
import { getTokenByAddress } from '../utils/tokens';
import { toBaseUnit, getSwapStatus } from '../utils/general';
import BorderedSection from './BorderSection';
import SwapStatusChip from './SwapStatusChip';


const contractAddresses = require('../contracts/contract-address.json');

const StyledTableContainer = styled(TableContainer)`
    margin: 0 auto;
    max-width: 100%;
    background-color: transparent;
    padding: 0.5em;
`;

const StyledTable = styled(Table)`
    width: 100%;
    table-layout: fixed;
`;

const StyledTableHead = styled(TableHead)`
    border-bottom: 1px solid white;
`;

const StyledTableRow = styled(TableRow)`
    &:nth-of-type(odd) {
        background-color: #328094;
    }
    &:nth-of-type(even) {
        background-color: #358a9e;
    }
    &:hover {
        background-color: #235666;
        cursor: pointer;
    }
`;

const StyledTableCell = styled(TableCell)`
    color: white;
    text-align: center;
    border-bottom: none;
`;

const StyledHeaderTableCell = styled(StyledTableCell)`
    font-weight: bold;
`;

const StyledMessage = styled(Typography)`
    color: white;
    text-align: center;
    margin-top: 20px;
    display: block;
    width: 100%;
`;

const UserSwapsList = ({ userAddress, network, activeSwapsListTab }) => {
    const [userSwaps, setUserSwaps] = useState([]);
    const [destinationSwaps, setDestinationSwaps] = useState([]);
    const [currentBlockTimestamp, setCurrentBlockTimestamp] = useState(null);

    useEffect(() => {
        async function _getCurrentBlockTimestamp() {
            try {
                const currentBlockTimestamp = await getCurrentBlockTimestamp();
                setCurrentBlockTimestamp(currentBlockTimestamp);
            } catch (err) {
                console.error(err);
            }
        }

        if (network) {
            _getCurrentBlockTimestamp();
        }
    }, [network]);

    useEffect(() => {
        const fetchUserSwaps = async () => {
            const swapHashes = await getUserSwaps(contractAddresses.SwapManager[network], userAddress);

            const swapsWithHash = await Promise.all(
                

                swapHashes.map(async (hash) => {
                    const swapDetails = await getSwap(contractAddresses.SwapManager[network], hash);
                    const srcAmountInBaseUnit = await toBaseUnit(swapDetails.srcAmount, swapDetails.srcTokenAddress);
                    const dstAmountInBaseUnit = await toBaseUnit(swapDetails.dstAmount, swapDetails.dstTokenAddress);

                    return {
                        hash,
                        details: {
                            ...swapDetails,
                            srcAmountInBaseUnit: srcAmountInBaseUnit,
                            dstAmountInBaseUnit: dstAmountInBaseUnit,
                        },
                    };
                })
            );
            setUserSwaps(swapsWithHash);
        };

        const fetchDestinationSwaps = async () => {
            const swapHashes = await getDstUserSwaps(contractAddresses.SwapManager[network], userAddress);
            const swapsWithHash = await Promise.all(
                swapHashes.map(async (hash) => {
                    const swapDetails = await getSwap(contractAddresses.SwapManager[network], hash);
                    const srcAmountInBaseUnit = await toBaseUnit(swapDetails.srcAmount, swapDetails.srcTokenAddress);
                    const dstAmountInBaseUnit = await toBaseUnit(swapDetails.dstAmount, swapDetails.dstTokenAddress);

                    return {
                        hash,
                        details: {
                            ...swapDetails,
                            srcAmountInBaseUnit: srcAmountInBaseUnit,
                            dstAmountInBaseUnit: dstAmountInBaseUnit,
                        },
                    };
                })
            );
            setDestinationSwaps(swapsWithHash);
        };

        fetchUserSwaps();
        fetchDestinationSwaps();
    }, [userAddress, network]);

    const handleRowClick = (swapHash) => {
        window.open(`/swap/${swapHash}`, '_blank');
    };

    const renderSwapsTable = (swaps, tableTitle) => {
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
                            {swaps.length === 0 ? (
                                <TableRow>
                                    <StyledTableCell />
                                    <StyledTableCell>
                                        <StyledMessage variant='subtitle1'>Nothing to show</StyledMessage>
                                    </StyledTableCell>
                                    <StyledTableCell />
                                </TableRow>
                            ) : (
                                swaps.map((swap, index) => {
                                    const srcToken = getTokenByAddress(swap.details.srcTokenAddress, network).name;
                                    const dstToken = getTokenByAddress(swap.details.dstTokenAddress, network).name;
                                    const srcAmount = swap.details.srcAmountInBaseUnit.toString();
                                    const dstAmount = swap.details.dstAmountInBaseUnit.toString();

                                    const isSwapsForYou = activeSwapsListTab === 'swapsForYou';
                                    const displayCreatedTime = new Date(swap.details.createdTime * 1000).toLocaleString();
                                    const displaySrcAmount = isSwapsForYou ? dstAmount : srcAmount;
                                    const displayDstAmount = isSwapsForYou ? srcAmount : dstAmount;
                                    const displaySrcToken = isSwapsForYou ? dstToken : srcToken;
                                    const displayDstToken = isSwapsForYou ? srcToken : dstToken;

                                    return (
                                        <StyledTableRow key={index} onClick={() => handleRowClick(swap.hash)}>
                                            <StyledTableCell align='right'>
                                                {displayCreatedTime}
                                            </StyledTableCell>
                                            <StyledTableCell align='right'>
                                                {displaySrcAmount} {displaySrcToken}
                                            </StyledTableCell>
                                            <StyledTableCell align='right'>
                                                {displayDstAmount} {displayDstToken}
                                            </StyledTableCell>
                                            <StyledTableCell><SwapStatusChip status={getSwapStatus(swap.details, currentBlockTimestamp)} /></StyledTableCell>
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
            {activeSwapsListTab === 'yourSwaps' && renderSwapsTable(userSwaps, 'Your swaps')}
            {activeSwapsListTab === 'swapsForYou' && renderSwapsTable(destinationSwaps, 'Swaps for you')}
        </div>
    );
};

export default UserSwapsList;
