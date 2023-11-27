import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import { getUserSwaps, getDstUserSwaps, getSwap } from '../utils/web3';
import { getTokenByAddress } from '../utils/tokens';
import { toBaseUnit } from '../utils/general';
import BorderedSection from './BorderSection';


const contractAddresses = require('../contracts/contract-address.json');

const UserSwapsList = ({ userAddress, network, activeSwapsListTab }) => {
    const [userSwaps, setUserSwaps] = useState([]);
    const [destinationSwaps, setDestinationSwaps] = useState([]);

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
                               <StyledHeaderTableCell>You send</StyledHeaderTableCell>
                               <StyledHeaderTableCell>You get</StyledHeaderTableCell>
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
                               swaps.map((swap, index) => (
                                   <StyledTableRow key={index} onClick={() => handleRowClick(swap.hash)}>
                                       <StyledTableCell align='right'>
                                           {swap.details.srcAmountInBaseUnit.toString()} {getTokenByAddress(swap.details.srcTokenAddress).name}
                                       </StyledTableCell>
                                       <StyledTableCell align='right'>
                                           {swap.details.dstAmountInBaseUnit.toString()} {getTokenByAddress(swap.details.dstTokenAddress).name}
                                       </StyledTableCell>
                                       <StyledTableCell>{swap.details.status === 0 ? 'OPENED' : swap.details.status === 1 ? 'CLOSED' : 'CANCELED'}</StyledTableCell>
                                   </StyledTableRow>
                               ))
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
