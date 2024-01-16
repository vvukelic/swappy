import { useState } from 'react';

const useTransactionModal = () => {
    const [txModalOpen, setTxModalOpen] = useState(false);
    const [txStatus, setTxStatus] = useState('');
    const [txStatusTxt, setTxStatusTxt] = useState('');
    const [txErrorTxt, setTxErrorTxt] = useState(null);

    const startTransaction = (message) => {
        setTxModalOpen(true);
        setTxStatus('mining');
        setTxStatusTxt(message);
        setTxErrorTxt(null);
    };

    const endTransaction = (success, message) => {
        if (success) {
            setTxStatus('success');
            setTxStatusTxt(message);
        } else {
            setTxStatus('fail');
            setTxStatusTxt('');
            setTxErrorTxt(message);
        }
    };

    return { txModalOpen, setTxModalOpen, txStatus, txStatusTxt, txErrorTxt, startTransaction, endTransaction };
};

export default useTransactionModal;
