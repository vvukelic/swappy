import React, { createContext, useState, useContext } from 'react';
import { getSupportedNetworks } from '../utils/general';

const NetworkWithoutWalletContext = createContext({
    network: getSupportedNetworks()[0],
    setNetwork: () => {},
});

export const NetworkWithoutWalletProvider = ({ children }) => {
    const [networkWithoutWallet, setNetworkWithoutWallet] = useState(getSupportedNetworks()[0]);

    return <NetworkWithoutWalletContext.Provider value={{ networkWithoutWallet, setNetworkWithoutWallet }}>{children}</NetworkWithoutWalletContext.Provider>;
};

export const useNetworkWithoutWallet = () => useContext(NetworkWithoutWalletContext);
