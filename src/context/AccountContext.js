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
    const [network, setNetwork] = useState(null);

    return <AccountContext.Provider value={{ defaultAccount, setDefaultAccount, network, setNetwork }}>{children}</AccountContext.Provider>;
}
