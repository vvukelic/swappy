import Document, { Html, Head, Main, NextScript } from 'next/document';
import { GA_TRACKING_ID } from '../lib/gtag';

class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${GA_TRACKING_ID}', {
                                    page_path: window.location.pathname,
                                });
                            `,
                        }}
                    />
                    <link rel='icon' href='../images/favicon/favicon.ico' sizes='48x48' />
                    <link rel='icon' href='../images/favicon/favicon-16x16.png' sizes='16x16' />
                    <link rel='icon' href='../images/favicon/favicon-32x32.png' sizes='32x32' />
                    <link rel='apple-touch-icon' href='../images/favicon/apple-touch-icon.png' sizes='180x180' />
                    <title>Swappy - trade crypto on your own terms!</title>
                    <meta name='description' content='Swappy is a platform facilitating decentralized, peer-to-peer (P2P) swaps, offering users a trustless environment for over-the-counter (OTC) trading.' />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
