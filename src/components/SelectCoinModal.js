import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

function SelectCoinModal({ open, onClose, coins, handleCoinSelection }) {
    const selectCoin = (coin) => {
        handleCoinSelection(coin);
        onClose();
    };

    return (
        <Dialog onClose={onClose} open={open}>
            <DialogTitle>Select a Coin</DialogTitle>
            <List>
                {coins.map((coin) => (
                    <ListItem button onClick={() => selectCoin(coin)} key={coin.name}>
                        <ListItemText primary={coin.name} />
                    </ListItem>
                ))}
            </List>
        </Dialog>
    );
}

export default SelectCoinModal;
