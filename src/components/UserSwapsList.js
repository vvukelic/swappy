import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Link } from '@mui/material';
import { getUserSwaps, getDstUserSwaps, getSwap } from '../utils/web3';
import { getTokenByAddress } from '../utils/tokens';
import { toBaseUnit } from '../utils/general';
import BorderedSection from './BorderSection';


const contractAddresses = require('../contracts/contract-address.json');

const UserSwapsList = ({ userAddress, network }) => {
    const [userSwaps, setUserSwaps] = useState([]);
    const [destinationSwaps, setDestinationSwaps] = useState([]);

    const StyledTableContainer = styled(TableContainer)`
        margin: 0 auto;
        max-width: 100%;
        background-color: transparent;
        padding: 0.5em;
    `;

    const StyledTableCell = styled(TableCell)`
        color: white;
    `;

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
                    return { hash, details: swapDetails };
                })
            );
            setDestinationSwaps(swapsWithHash);
        };

        fetchUserSwaps();
        fetchDestinationSwaps();
    }, [userAddress, network]);

    const renderSwapsTable = (swaps, tableTitle) => (
        <BorderedSection title={tableTitle}>
            <StyledTableContainer component={Paper}>
                <Table aria-label='simple table'>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>You sell</StyledTableCell>
                            <StyledTableCell>You buy</StyledTableCell>
                            <StyledTableCell>Status</StyledTableCell>
                            <StyledTableCell>Details</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {swaps.map((swap, index) => (
                            <TableRow key={index}>
                                <StyledTableCell align='right'>
                                    {swap.details.srcAmountInBaseUnit.toString()} {getTokenByAddress(swap.details.srcTokenAddress).name}
                                </StyledTableCell>
                                <StyledTableCell align='right'>
                                    {swap.details.dstAmountInBaseUnit.toString()} {getTokenByAddress(swap.details.dstTokenAddress).name}
                                </StyledTableCell>
                                <StyledTableCell>{swap.details.status === 0 ? 'OPEN' : swap.details.status === 1 ? 'CLOSED' : 'CANCELED'}</StyledTableCell>
                                <StyledTableCell>
                                    <Link href={`/swap/${swap.hash}`} target='_blank' rel='noopener noreferrer'>
                                        View
                                    </Link>
                                </StyledTableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </StyledTableContainer>
        </BorderedSection>
    );

    return (
        <div>
            {renderSwapsTable(userSwaps, 'Your swaps')}
            {renderSwapsTable(destinationSwaps, 'Swaps from other users')}
        </div>
    );
};

export default UserSwapsList;
