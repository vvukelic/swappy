import { createContext, useContext, useState } from 'react';

const AccountContext = createContext(null);

export function useAccount() {
    const context = useContext(AccountContext);

    if (context === null) {
        throw new Error('useAccount must be used within an AccountProvider');
    }

    return context;
}

export function AccountProvider({ children }) {
    const [defaultAccount, setDefaultAccount] = useState(null);
    const [walletConnected, setWalletConnected] = useState(false);

    return <AccountContext.Provider value={{ defaultAccount, setDefaultAccount, walletConnected, setWalletConnected }}>{children}</AccountContext.Provider>;
}
