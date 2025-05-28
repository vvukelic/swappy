import React from 'react';
import styled from '@emotion/styled';

const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: -webkit-fill-available;

    border-left: 1px solid #7698ea;
    border-bottom: 1px solid #7698ea;
    border-right: 1px solid #7698ea;
    border-radius: 5px;
    margin-left: 1em;
    margin-right: 1em;
`;

const Header = styled.div`
    display: flex;
    flex-direction: row;
    width: 100% !important;
`;

const HeaderBorderBefore = styled.div`
    border-top: 1px solid #7698ea;
    width: 1em;
    border-top-left-radius: 5px;
`;

const HeaderTitle = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.25em;
    width: fit-content;
    height: 2em;
    margin: -1em 0.5em 0em 0.5em;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1em;
    font-weight: 400;
    color: white;
`;

const HeaderBorderAfter = styled.div`
    border-top: 1px solid #7698ea;
    width: 1em;
    flex-grow: 2;
    border-top-right-radius: 5px;
`;

function BorderedSection({ title, children }) {
    return (
        <MainContainer>
            <Header>
                <HeaderBorderBefore />
                {title && <HeaderTitle>{title && <span>{title}</span>}</HeaderTitle>}
                <HeaderBorderAfter />
            </Header>
            <div>{children}</div>
        </MainContainer>
    );
}

export default BorderedSection;
