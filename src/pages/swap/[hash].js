import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import SwapDetails from '../../components/SwapDetails';
import { useRouter } from 'next/router';

export default () => {
    const router = useRouter();

    return (
        <Layout activeTab='swapDetails'>
            <SwapDetails hash={router.query.hash} />
        </Layout>
    );
};
