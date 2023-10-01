import React from 'react';
import Header from './Header';
import { AccountProvider } from '../context/AccountContext';

export default ({ children, setActiveTab }) => {
    return (
        <AccountProvider>
            <Header setActiveTab={setActiveTab} />
            {children}
        </AccountProvider>
    );
};
