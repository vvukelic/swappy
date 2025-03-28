import React from 'react';
import styled from '@emotion/styled';
import { Box, Typography, Link } from '@mui/material';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';


const TruncateBase = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
`;


export const Truncate = React.forwardRef((props, ref) => <TruncateBase ref={ref} {...props} />);

export const BackgroundBox = styled(Box)`
    min-height: calc(100vh - 100px);
    background: linear-gradient(to bottom, #1b3a47, #45bbd6);
    padding-top: 3em;

    @media (max-width: 600px) {
        padding-top: 1.5em;
    }
`;

export const ModalContent = styled.div`
    background-color: #358a9f;
    padding: 20px;
    border-radius: 10px;
    outline: none;
    color: white;
    min-width: 500px;
    max-width: 600px;
    width: '80%';

    @media (max-width: 600px) {
        min-width: 100%;
    }
`;

export const StyledModal = styled(Modal)`
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const ModalTitle = styled(Typography)`
    font-weight: bold;
    text-align: center;
    margin-bottom: 0.5em;
`;

export const FooterContainer = styled(Box)`
    width: 100%;
    padding: 1em 0;
    background-color: #1b3a47;
    color: white;
    text-align: center;
    font-size: 0.9em;
    margin-top: auto;
`;

export const StyledTokenLinkName = styled(Typography)`
    text-decoration: none;
    color: inherit;

    &:hover {
        text-decoration: underline;
        cursor: pointer;
    }
`;

export const StyledLink = styled(Link)`
    text-decoration: none;
    color: inherit;

    &:hover {
        text-decoration: underline;
        cursor: pointer;
    }
`;

export const RelativePositionContainer = styled.div`
    position: relative;
    display: grid;
`;

export const StyledTabButton = styled(({ isActive, ...props }) => <Button {...props} />)`
    margin-left: 10px;
    color: white;
    background-color: ${(props) => (props.isActive ? '#396777' : 'transparent')};
    border: 1px solid transparent;

    &:hover {
        background-color: ${(props) => (props.isActive ? '#396777' : '#396777')};
        border-color: #ffffff;
    }
`;

export const DropdownHoverMenuButton = styled(StyledTabButton)`
    margin-left: 0;
`;

export const DropdownHoverMenu = styled(Box)`
    position: absolute;
    width: ${(props) => props.width};
    background-color: #0f2934;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    padding: 10px;
    display: ${(props) => (props.show ? 'flex' : 'none')};
    flex-direction: column;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);

    @media (max-width: 900px) {
        position: static;
        transform: none;
        left: 0;
        width: auto;
    }
`;
