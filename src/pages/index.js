import React from 'react';
import { Card, CardMedia, Box, AppBar, Toolbar } from '@mui/material';
import PrimaryButton from '../components/PrimaryButton';
import { BackgroundBox } from '../sharedStyles/general';


export default () => {
    function onDappBtnClick() {
        window.location.href = '/swap';
    }

    return (
        <>
            <Box sx={{ flexGrow: 1, padding: 0, margin: 0 }}>
                <AppBar position='sticky' elevation={0} component='nav'>
                    <Toolbar sx={{ backgroundColor: '#1B3A47' }}>
                        <Card
                            sx={{
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                            }}
                        >
                            <CardMedia
                                sx={{
                                    width: '100px',
                                    height: '100px',
                                    backgroundColor: 'transparent',
                                }}
                                image='/images/swappy_logo.png'
                            />
                        </Card>
                        <Box sx={{ flexGrow: 1 }} />
                        <PrimaryButton onClick={onDappBtnClick} buttonText='Go to dapp' />
                    </Toolbar>
                </AppBar>
            </Box>
            <BackgroundBox></BackgroundBox>
        </>
    );
};
