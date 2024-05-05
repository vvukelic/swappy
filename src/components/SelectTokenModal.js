import React from 'react';
import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Avatar, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import styled from '@emotion/styled';
import { getTokenImageUrl, addCustomToken, getAllTokens } from '../utils/tokens';
import { useWalletConnect } from '../hooks/useWalletConnect';
import networks from '../data/networks';


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

function SelectTokenModal({ open, onClose, handleTokenSelection, title, excludeToken }) {
    const { blockchainUtil } = useWalletConnect();
    const [searchInput, setSearchInput] = useState('');
    const [customToken, setCustomToken] = useState(null);
    const [filteredTokens, setfilteredTokens] = useState([]);

    useEffect(() => {
        async function processSearchInput() {
            try {
                const tokenSymbol = await blockchainUtil.getTokenSymbol(searchInput);
                setCustomToken({
                    'symbol': tokenSymbol,
                    'networkSpecificAddress': {
                        [blockchainUtil.network.uniqueName]: searchInput
                    }
                });
            } catch (err) {
                console.error(err);
            }
        }

        if (isValidEthereumAddress(searchInput)) {
            processSearchInput();
        }
    }, [searchInput]);

    useEffect(() => {
        const selectedNetwork = blockchainUtil?.network ? blockchainUtil.network : networks.ethereum;

        setfilteredTokens(
                getAllTokens().filter(token =>
                    token.networkSpecificAddress[selectedNetwork.uniqueName] &&
                    token !== excludeToken &&
                    (token.symbol?.includes(searchInput.toUpperCase()) || token.networkSpecificAddress[selectedNetwork.uniqueName].includes(searchInput))
                )
            );
    }, [blockchainUtil, searchInput, excludeToken]);

    const handleSearchChange = (event) => {
        setSearchInput(event.target.value);
    };

    const selectToken = (token) => {
        handleTokenSelection(token);
        onClose();
    };

    const handleAddTokenClick = () => {
        addCustomToken(customToken);
        selectToken(customToken);
    };

    return (
        <StyledDialog onClose={onClose} open={open}>
            <StyledDialogTitle>{title}</StyledDialogTitle>
            <StyledTextField variant='outlined' label='Search by name or input address' onChange={handleSearchChange} fullWidth InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
            <ScrollableListContainer>
                <List>
                    {filteredTokens.length > 0 ? (
                        filteredTokens.map((token) => (
                            <StyledListItem onClick={() => selectToken(token)} key={token.symbol}>
                                <StyledAvatar src={getTokenImageUrl(token)} />
                                <ListItemText primary={token.symbol} />
                            </StyledListItem>
                        ))
                    ) : customToken ? (
                        <ListItem>
                            <IconButton onClick={handleAddTokenClick}>
                                <AddIcon />
                            </IconButton>
                            <ListItemText primary='Add token' />
                        </ListItem>
                    ) : null}
                </List>
            </ScrollableListContainer>
        </StyledDialog>
    );
}

export default SelectTokenModal;
