import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NotificationProvider } from '../components/NotificationProvider';
import { Web3Modal } from '../context/Web3Modal';
import * as gtag from '../lib/gtag';

const theme = createTheme();

function MyApp({ Component, pageProps }) {
    const router = useRouter();

    useEffect(() => {
        const handleRouteChange = (url) => {
            gtag.pageview(url);
        };
        router.events.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events]);

    return (
        <NotificationProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Web3Modal>
                    <Component {...pageProps} />
                </Web3Modal>
            </ThemeProvider>
        </NotificationProvider>
    );
}

export default MyApp;
