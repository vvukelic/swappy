import React from 'react';
import { CircularProgress, Typography, Box, Tooltip } from '@mui/material';


function SwapOfferPercentageFilledLabel({ percentage }) {
    return (
        <Tooltip title={`${percentage}% of this offer has been filled.`}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                    variant='determinate'
                    value={100}
                    sx={{ color: '#22365e', position: 'absolute', zIndex: 1 }}
                />
                <CircularProgress
                    variant='determinate'
                    value={percentage}
                    sx={{ color: '#f8b83e', position: 'relative', zIndex: 2 }}
                />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant='caption' component='div' color='white' sx={{ fontSize: '0.65rem' }}>
                        {`${Math.round(percentage)}%`}
                    </Typography>
                </Box>
            </Box>
        </Tooltip>
    );
}

export default SwapOfferPercentageFilledLabel;
