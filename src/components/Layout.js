import React from 'react';
import Header from './Header';
import { AccountProvider } from '../context/AccountContext';

export default (props) => {
    return (
        <AccountProvider>
            <Header></Header>
            {props.children}
        </AccountProvider>
    );
};
