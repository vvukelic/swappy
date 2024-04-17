import React from 'react';
import Header from './Header';
import { BackgroundBox } from '../sharedStyles/general';


export default ({ children, activeTab, setActiveTab, activeSwapOffersListTab, setActiveSwapOffersListTab }) => {
    return (
        <>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} activeSwapOffersListTab={activeSwapOffersListTab} setActiveSwapOffersListTab={setActiveSwapOffersListTab} />
            <BackgroundBox>{children}</BackgroundBox>
        </>
    );
};
