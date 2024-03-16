import React from 'react';
import Header from './Header';
import { BackgroundBox } from '../sharedStyles/general';
import { AccountProvider } from '../context/AccountContext';


export default ({ children, activeTab, setActiveTab, activeSwapOffersListTab, setActiveSwapOffersListTab }) => {
    return (
        <AccountProvider>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} activeSwapOffersListTab={activeSwapOffersListTab} setActiveSwapOffersListTab={setActiveSwapOffersListTab} />
            <BackgroundBox>{children}</BackgroundBox>
        </AccountProvider>
    );
};
