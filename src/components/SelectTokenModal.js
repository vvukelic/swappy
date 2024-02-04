import React from 'react';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Avatar, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

const ScrollableListContainer = styled.div`
    max-height: 500px;
    overflow-y: auto;
`;

const isValidEthereumAddress = (address) => {
    return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
};

function SelectTokenModal({ open, onClose, handleTokenSelection, title, network }) {
    const [searchInput, setSearchInput] = useState('');

    const handleSearchChange = (event) => {
        setSearchInput(event.target.value);
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
            <ScrollableListContainer>
                <List>
                    {filteredTokens.length > 0 ? (
                        filteredTokens.map((token) => (
                            <StyledListItem onClick={() => selectToken(token)} key={token.name}>
                                <StyledAvatar src={getTokenImageUrl(token)} />
                                <ListItemText primary={token.name} />
                            </StyledListItem>
                        ))
                    ) : isValidEthereumAddress(searchInput) ? (
                        <ListItem>
                            <AddIcon />
                            <ListItemText primary='Add token' />
                        </ListItem>
                    ) : null}
                </List>
            </ScrollableListContainer>
        </StyledDialog>
    );
}

export default SelectTokenModal;
