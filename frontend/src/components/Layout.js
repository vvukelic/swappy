import React from 'react';
import Header from './Header';

export default (props) => {
    return (
        <div>
            <Header></Header>
            {props.children}
        </div>
    );
};
