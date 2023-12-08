import React from 'react';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Avatar, TextField } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';
import styled from '@emotion/styled';
import { getCoinImageUrl } from '../utils/tokens';


const StyledDialog = styled(Dialog)`
    & .MuiPaper-root {
        color: white;
        background-color: #358a9f;
        min-width: 300px;
    }
`;

const StyledDialogTitle = styled(DialogTitle)`
    text-align: center;
`;

const StyledAvatar = styled(Avatar)`
    width: 24px;
    height: 24px;
    margin-right: 1em;
`;

const StyledListItem = styled(ListItem)`
    &:hover {
        background-color: #224e5d;
        cursor: pointer;
    }
`;

const StyledTextField = styled(TextField)`
    color: white;
    min-width: 200px;
    padding: 0 0.5em;
`;

function SelectCoinModal({ open, onClose, coins, handleCoinSelection }) {
    const [searchInput, setSearchInput] = useState('');

    const handleSearchChange = (event) => {
        setSearchInput(event.target.value.toLowerCase());
    };

    const filteredCoins = coins.filter(coin =>
        coin.name.toLowerCase().includes(searchInput) ||
        (coin.address && coin.address.toLowerCase().includes(searchInput))
    );

    const selectCoin = (coin) => {
        handleCoinSelection(coin);
        onClose();
    };

    return (
        <StyledDialog onClose={onClose} open={open}>
            <StyledDialogTitle>Select a Coin</StyledDialogTitle>
            <StyledTextField variant='outlined' label='Search by name or input address' onChange={handleSearchChange} fullWidth InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
            <List>
                {filteredCoins.map((coin) => (
                    <StyledListItem onClick={() => selectCoin(coin)} key={coin.name}>
                        <StyledAvatar src={getCoinImageUrl(coin)} />
                        <ListItemText primary={coin.name.toUpperCase()} />
                    </StyledListItem>
                ))}
            </List>
        </StyledDialog>
    );
}

export default SelectCoinModal;
