import React from 'react';
import Box from '@mui/material/Box';
import { Button, Typography } from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';

function TokenButton({ imageSrc, text, onClick, ...props }) {
    return (
        <Button
            onClick={onClick}
            variant='outlined'
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                textTransform: 'none',
                borderRadius: 10,
                backgroundColor: '#2a374e',
            }}
        >
            <Box
                component='span'
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 1,
                }}
            >
                <img
                    src={imageSrc}
                    width='auto'
                    height='100%'
                />
            </Box>
            <Typography
                sx={{
                    color: 'white',
                    marginLeft: 1,
                }}
            >
                {text}
            </Typography>
            <ArrowDropDown></ArrowDropDown>
        </Button>
    );
}

export default TokenButton;
