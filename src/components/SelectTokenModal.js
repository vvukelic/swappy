import React from 'react';
import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { Avatar, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import styled from '@emotion/styled';
import { getTokenImageUrl, addCustomToken, getAllTokens, getTokenByAddress } from '../utils/tokens';
import { useWalletConnect } from '../hooks/useWalletConnect';
import { useNetworkWithoutWallet } from '../context/NetworkWithoutWallet';
import { StyledTextField, textFieldColor } from '../sharedStyles/general';


const StyledDialog = styled(Dialog)`
    & .MuiPaper-root {
        color: white;
        background-color: #2f50a1;
        min-width: 300px;
        border: #7698ea solid 1px;
    }
`;

const StyledDialogTitle = styled(DialogTitle)`
    text-align: center;
    padding-bottom: 0;
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

const InputTokenTextField = styled(StyledTextField)`
    width: 275px;
    margin: 1em auto;

    & .MuiFormControl-root {
        padding: 0 0.7em;
    }
`;

const TitleGroupDiv = styled.div`
    border-bottom: ${textFieldColor} solid 1px;
    text-align: center;
`;

const ScrollableListContainer = styled.div`
    max-height: 500px;
    overflow-y: auto;
`;

const CustomAddTokenItem = styled(ListItem)`
    &:hover {
        background-color: #224e5d;
        cursor: pointer;
    }
`;

const SecondaryTokenName = styled(Typography)`
    color: ${textFieldColor};
`;

const isValidEthereumAddress = (address) => {
    return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
};

function SelectTokenModal({ open, onClose, handleTokenSelection, title, excludeToken }) {
    const { blockchainUtil } = useWalletConnect();
    const [searchInput, setSearchInput] = useState('');
    const [customToken, setCustomToken] = useState(null);
    const [filteredTokens, setFilteredTokens] = useState([]);
    const [allTokens, setAllTokens] = useState([]);
    const { networkWithoutWallet } = useNetworkWithoutWallet();

    useEffect(() => {
        const selectedNetwork = blockchainUtil?.network ? blockchainUtil.network : networkWithoutWallet;
        const tokens = getAllTokens(selectedNetwork.uniqueName);
        setAllTokens(tokens);
        setFilteredTokens(tokens);
    }, [blockchainUtil, networkWithoutWallet]);

    useEffect(() => {
        const searchInputLowerCase = searchInput.toLowerCase();

        if (isValidEthereumAddress(searchInputLowerCase)) {
            const knownToken = getTokenByAddress(searchInputLowerCase, blockchainUtil.network.uniqueName);

            if (knownToken) {
                setFilteredTokens([knownToken]);
                setCustomToken(null);
            } else {
                async function processSearchInput() {
                    const customToken = await blockchainUtil.getErc20Token(searchInputLowerCase);
                    setCustomToken(customToken);
                    setFilteredTokens([]);
                }
                processSearchInput();
            }
        } else {
            setCustomToken(null);

            const filtered = allTokens
                .filter((token) => token.name.toLowerCase().includes(searchInputLowerCase) || token.symbol.toLowerCase().includes(searchInputLowerCase))
                .filter((token) => token !== excludeToken);
            setFilteredTokens(filtered);
        }
    }, [searchInput, allTokens, excludeToken, blockchainUtil]);

    const handleSearchChange = (event) => {
        setSearchInput(event.target.value);
    };

    const selectToken = (token) => {
        handleTokenSelection(token);
        onClose();
    };

    const handleAddTokenClick = () => {
        if (customToken) {
            addCustomToken(customToken, blockchainUtil.network.uniqueName);
            setAllTokens(getAllTokens(blockchainUtil.network.uniqueName));
            selectToken(customToken);
        }
    };

    return (
        <StyledDialog onClose={onClose} open={open}>
            <TitleGroupDiv>
                <StyledDialogTitle>{title}</StyledDialogTitle>
                <InputTokenTextField variant='outlined' label='Search by name or contract address' onChange={handleSearchChange} value={searchInput} fullWidth InputLabelProps={{ style: { color: 'white' } }} inputProps={{ style: { color: 'white' } }} />
            </TitleGroupDiv>
            
            <ScrollableListContainer>
                <List>
                    {filteredTokens.length > 0 ? (
                        filteredTokens.map((token) => (
                            <StyledListItem onClick={() => selectToken(token)} key={token.address}>
                                <StyledAvatar src={getTokenImageUrl(token)} />
                                <ListItemText 
                                    primary={token.symbol}
                                    secondary={<SecondaryTokenName>{token.name}</SecondaryTokenName>} 
                                />
                            </StyledListItem>
                        ))
                    ) : customToken ? (
                        <CustomAddTokenItem onClick={handleAddTokenClick}>
                            <IconButton>
                                <AddIcon />
                            </IconButton>
                            <ListItemText primary='Add token' secondary={`${customToken.symbol} - ${customToken.name}`} />
                        </CustomAddTokenItem>
                    ) : null}
                </List>
            </ScrollableListContainer>
        </StyledDialog>
    );
}

export default SelectTokenModal;
