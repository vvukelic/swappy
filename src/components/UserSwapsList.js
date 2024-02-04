import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import { getUserSwaps, getDstUserSwaps } from '../utils/web3';
import { getSwap } from '../utils/general';
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

    useEffect(() => {
        const fetchUserSwaps = async () => {
            const swapHashes = await getUserSwaps(contractAddresses.SwapManager[network], userAddress);

            const swapsWithHash = await Promise.all(
                swapHashes.map(async (hash) => {
                    const swap = await getSwap(contractAddresses.SwapManager[network], hash, network);

                    return {
                        hash,
                        ...swap,
                    };
                })
            );
            setUserSwaps(swapsWithHash);
        };

        const fetchDestinationSwaps = async () => {
            const swapHashes = await getDstUserSwaps(contractAddresses.SwapManager[network], userAddress);
            const swapsWithHash = await Promise.all(
                swapHashes.map(async (hash) => {
                    const swap = await getSwap(contractAddresses.SwapManager[network], hash, network);

                    return {
                        hash,
                        ...swap,
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
                                    <StyledTableCell colSpan={4} style={{ textAlign: 'center' }}>
                                        <StyledMessage variant='subtitle1'>Nothing to show</StyledMessage>
                                    </StyledTableCell>
                                </TableRow>
                            ) : (
                                swaps.map((swap, index) => {
                                    const srcAmount = swap.srcAmountInBaseUnit.toString();
                                    const dstAmount = swap.dstAmountInBaseUnit.toString();

                                    const isSwapsForYou = activeSwapsListTab === 'swapsForYou';
                                    const displaySrcAmount = isSwapsForYou ? dstAmount : srcAmount;
                                    const displayDstAmount = isSwapsForYou ? srcAmount : dstAmount;
                                    const displaySrcTokenName = isSwapsForYou ? swap.dstTokenName : swap.srcTokenName;
                                    const displayDstTokenName = isSwapsForYou ? swap.srcTokenName : swap.dstTokenName;;

                                    return (
                                        <StyledTableRow key={index} onClick={() => handleRowClick(swap.hash)}>
                                            <StyledTableCell align='right'>{swap.displayCreatedTime}</StyledTableCell>
                                            <StyledTableCell align='right'>
                                                {displaySrcAmount} {displaySrcTokenName}
                                            </StyledTableCell>
                                            <StyledTableCell align='right'>
                                                {displayDstAmount} {displayDstTokenName}
                                            </StyledTableCell>
                                            <StyledTableCell>
                                                <SwapStatusChip status={swap.readableStatus} />
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
            {activeSwapsListTab === 'yourSwaps' && renderSwapsTable(userSwaps, 'Your swaps')}
            {activeSwapsListTab === 'swapsForYou' && renderSwapsTable(destinationSwaps, 'Swaps for you')}
        </div>
    );
};

export default UserSwapsList;
