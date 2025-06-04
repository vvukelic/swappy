import styled from '@emotion/styled';
import { TableContainer, Table, TableHead, TableRow, TableCell, Paper, Typography } from '@mui/material';

export const StyledTableContainer = styled(TableContainer)`
    margin: 0 auto;
    max-width: 100%;
    background-color: transparent;
    padding: 0.5em;
`;

export const StyledTable = styled(Table)`
    width: 100%;
    table-layout: fixed;
`;

export const StyledTableHead = styled(TableHead)`
    border-bottom: 1px solid white;
`;

export const StyledTableRow = styled(TableRow)`
    &:nth-of-type(odd) {
        background-color: #456ed6;
    }
    &:nth-of-type(even) {
        background-color: #3f64b1;
    }
`;

export const ClicableTableRow = styled(StyledTableRow)`
    &:hover {
        background-color: #284175;
        cursor: pointer;
    }
`;

export const StyledTableCell = styled(TableCell)`
    color: white;
    text-align: center;
    border-bottom: none;
`;

export const StyledHeaderTableCell = styled(StyledTableCell)`
    font-weight: bold;
`;

export const StyledMessage = styled(Typography)`
    color: white;
    text-align: center;
    margin-top: 20px;
    display: block;
    width: 100%;
`;
