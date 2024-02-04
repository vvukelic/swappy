import React from 'react';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Avatar, TextField } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';
import styled from '@emotion/styled';
import { getTokenImageUrl } from '../utils/tokens';
import tokenInfo from '../data/tokenInfo.json';


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
    width: 275px;
    margin: 0 auto;

    & .MuiFormControl-root {
        padding: 0 0.7em;
    }
`;

function SelectTokenModal({ open, onClose, handleTokenSelection, title, network }) {
    const [searchInput, setSearchInput] = useState('');

    const handleSearchChange = (event) => {
        setSearchInput(event.target.value.toLowerCase());
    };

    const filteredTokens = tokenInfo.filter(token =>
        token.name.includes(searchInput.toUpperCase()) ||
        (token.networkSpecificAddress[network] && token.networkSpecificAddress[network].includes(searchInput))
    );

    const selectToken = (token) => {
        handleTokenSelection(token);
        onClose();
    };

    return (
        <StyledDialog onClose={onClose} open={open}>
            <StyledDialogTitle>{title}</StyledDialogTitle>
            <StyledTextField variant='outlined' label='Search by name or input address' onChange={handleSearchChange} fullWidth InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
            <List>
                {filteredTokens.map((token) => (
                    <StyledListItem onClick={() => selectToken(token)} key={token.name}>
                        <StyledAvatar src={getTokenImageUrl(token)} />
                        <ListItemText primary={token.name} />
                    </StyledListItem>
                ))}
            </List>
        </StyledDialog>
    );
}

export default SelectTokenModal;
