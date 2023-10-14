import React from 'react';
import Header from './Header';
import { AccountProvider } from '../context/AccountContext';

export default ({ children, activeTab, setActiveTab }) => {
    return (
        <AccountProvider>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />
            {children}
        </AccountProvider>
    );
};
