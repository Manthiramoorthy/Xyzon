import { useState, useCallback } from 'react';

export const useConfirm = () => {
    const [confirmState, setConfirmState] = useState({
        show: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'warning',
        onConfirm: null,
        onCancel: null
    });

    const confirm = useCallback((messageOrOptions, title) => {
        return new Promise((resolve) => {
            let options;

            if (typeof messageOrOptions === 'string') {
                // Simple string message
                options = {
                    message: messageOrOptions,
                    title: title || 'Confirm Action'
                };
            } else {
                // Options object
                options = messageOrOptions;
            }

            setConfirmState({
                show: true,
                title: options.title || 'Confirm Action',
                message: options.message || 'Are you sure?',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                type: options.type || 'warning',
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, show: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState(prev => ({ ...prev, show: false }));
                    resolve(false);
                }
            });
        });
    }, []);

    const hideConfirm = useCallback(() => {
        setConfirmState(prev => ({ ...prev, show: false }));
    }, []);

    return {
        confirm,
        confirmState,
        hideConfirm
    };
};
