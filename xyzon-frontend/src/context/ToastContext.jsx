import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
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

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        const toast = {
            id,
            message,
            type, // 'success', 'error', 'warning', 'info'
            duration
        };

        setToasts(prev => [...prev, toast]);

        // Auto remove toast after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

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

    // Convenience methods
    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
        custom: (message, type, duration) => addToast(message, type, duration)
    };

    const value = {
        toasts,
        toast,
        removeToast,
        clearAllToasts,
        confirm,
        confirmState,
        hideConfirm
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};

export default ToastContext;
