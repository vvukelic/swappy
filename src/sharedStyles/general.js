import React from 'react';
import styled from '@emotion/styled';
import { Box } from '@mui/material';


const TruncateBase = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px; // Adjust based on your needs
`;

export const Truncate = React.forwardRef((props, ref) => <TruncateBase ref={ref} {...props} />);

export const BackgroundBox = styled(Box)`
    min-height: calc(100vh - 100px);
    background: linear-gradient(to bottom, #1b3a47, #45bbd6);
    padding-top: 3em;
`;
