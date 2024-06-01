import React, { createContext, useState, useContext } from 'react';
import networks from '../data/networks';

const NetworkWithoutWalletContext = createContext({
    network: networks['ethereum'],
    setNetwork: () => {},
});

export const NetworkWithoutWalletProvider = ({ children }) => {
    const [networkWithoutWallet, setNetworkWithoutWallet] = useState(networks['ethereum']);

    return <NetworkWithoutWalletContext.Provider value={{ networkWithoutWallet, setNetworkWithoutWallet }}>{children}</NetworkWithoutWalletContext.Provider>;
};

export const useNetworkWithoutWallet = () => useContext(NetworkWithoutWalletContext);
