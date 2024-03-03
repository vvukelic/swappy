import React from 'react';
import { CircularProgress, Typography, Box, Tooltip } from '@mui/material';

// Helper function to interpolate between two colors
function interpolateColor(color1, color2, factor) {
    const result = color1
        .slice(1)
        .match(/.{2}/g)
        .map((hex) => parseInt(hex, 16))
        .map((value, index) => {
            const color2Value = parseInt(color2.slice(1).match(/.{2}/g)[index], 16);
            return Math.round(value + (color2Value - value) * factor);
        })
        .map((value) => {
            const hex = value.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        })
        .join('');
    return `#${result}`;
}

function SwapOfferPercentageFilledLabel({ percentage }) {
    const startColor = '#643c72';
    const endColor = '#f8b83e';
    const factor = percentage / 100;
    const color = interpolateColor(startColor, endColor, factor);

    return (
        <Tooltip title={`This is a swap offer that can be partially filled. ${percentage}% of this offer has been filled.`}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                    variant='determinate'
                    value={percentage}
                    sx={{ color: color }} // Apply the interpolated color
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
                    <Typography variant='caption' component='div' color='white' sx={{ fontSize: '0.6rem' }}>
                        {`${Math.round(percentage)}%`}
                    </Typography>
                </Box>
            </Box>
        </Tooltip>
    );
}

export default SwapOfferPercentageFilledLabel;
