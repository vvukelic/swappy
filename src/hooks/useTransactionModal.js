import { useState } from 'react';

const useTransactionModal = () => {
    const [txModalOpen, setTxModalOpen] = useState(false);
    const [txStatus, setTxStatus] = useState('');
    const [txError, setTxError] = useState(null);

    const startTransaction = () => {
        setTxModalOpen(true);
        setTxStatus('Transaction is being processed. Please wait for confirmation...');
        setTxError(null);
    };

    const endTransaction = (success, message) => {
        if (success) {
            setTxStatus(message || 'Transaction confirmed!');
        } else {
            setTxStatus('');
            setTxError(message || 'Transaction failed. Please try again or contact support.');
        }

        setTimeout(() => setTxModalOpen(false), 5000); // Close the modal after a delay
    };

    return { txModalOpen, txStatus, txError, startTransaction, endTransaction };
};

export default useTransactionModal;
