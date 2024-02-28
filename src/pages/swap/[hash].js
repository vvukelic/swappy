import React from 'react';
import Layout from '../../components/Layout';
import SwapOfferDetails from '../../components/SwapOfferDetails';
import { useRouter } from 'next/router';

export default () => {
    const router = useRouter();

    return (
        <Layout activeTab='swapOfferDetails'>
            <SwapOfferDetails hash={router.query.hash} />
        </Layout>
    );
};
