import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NotificationProvider } from '../components/NotificationProvider';
import { Web3Modal } from '../context/Web3Modal';

const theme = createTheme();

function MyApp({ Component, pageProps }) {
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
