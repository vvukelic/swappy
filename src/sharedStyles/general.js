import React from 'react';
import styled from '@emotion/styled';
import { Box, Typography, Link, CardMedia, TextField } from '@mui/material';
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
    background: linear-gradient(to bottom, #1b2b47, #456ed6);
    padding-top: 3em;

    @media (max-width: 600px) {
        padding-top: 1.5em;
    }
`;

export const SwappyHome = styled(CardMedia)`
    width: 95px;
    height: 70px;
    background-color: transparent;

    &:hover {
        cursor: pointer !important;
    }
`;

export const ModalContent = styled.div`
    background-color: #2f50a1;
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
    background-color: #1b2a47;
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

const activeButtonColor = '#3050a1';

export const StyledTabButton = styled(({ isActive, ...props }) => <Button {...props} />)`
    margin-left: 10px;
    color: white;
    background-color: ${(props) => (props.isActive ? activeButtonColor : 'transparent')};
    border: 1px solid transparent;

    &:hover {
        background-color: ${(props) => (props.isActive ? activeButtonColor : activeButtonColor)};
        border-color: #ffffff;
    }
`;

export const DropdownHoverMenuButton = styled(StyledTabButton)`
    margin-left: 0;
`;

export const DropdownHoverMenu = styled(Box)`
    position: absolute;
    width: ${(props) => props.width};
    background-color: #355ab8;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    padding: 10px;
    display: ${(props) => (props.show ? 'flex' : 'none')};
    flex-direction: column;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0.5em;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.75);

    @media (max-width: 900px) {
        position: static;
        transform: none;
        left: 0;
        width: auto;
    }
`;

export const textFieldColor = '#7698ea';
export const StyledTextField = styled(TextField)({
    '& label': {
      color: textFieldColor,
    },
    '& label.Mui-focused': {
      color: textFieldColor,
    },
    '& .MuiOutlinedInput-root': {
      color: 'white', // text color
      '& fieldset': {
        borderColor: textFieldColor,
      },
      '&:hover fieldset': {
        borderColor: textFieldColor,
      },
      '&.Mui-focused fieldset': {
        borderColor: textFieldColor,
      },
    },
  });
