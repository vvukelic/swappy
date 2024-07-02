import Document, { Html, Head, Main, NextScript } from 'next/document';
import { GA_TRACKING_ID } from '../lib/gtag';

class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
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
