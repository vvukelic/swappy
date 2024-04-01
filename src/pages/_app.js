import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NotificationProvider } from '../components/NotificationProvider';

const theme = createTheme();

function MyApp({ Component, pageProps }) {
    return (
        <NotificationProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Component {...pageProps} />
            </ThemeProvider>
        </NotificationProvider>
    );
}

export default MyApp;
