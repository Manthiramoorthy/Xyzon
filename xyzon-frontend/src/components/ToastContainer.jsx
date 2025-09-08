import React from 'react';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from './ConfirmDialog';
import './ToastContainer.css';

const ToastItem = ({ toast, onRemove }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return '✓';
            case 'error':
                return '⚠';
            case 'warning':
                return '!';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    return (
        <div className={`toast-item toast-${toast.type}`}>
            <div className="toast-content">
                <div className="toast-icon">
                    {getIcon()}
                </div>
                <div className="toast-message">
                    {toast.message}
                </div>
                <button
                    className="toast-close"
                    onClick={() => onRemove(toast.id)}
                    aria-label="Close notification"
                >
                    ×
                </button>
            </div>
            <div className="toast-progress"></div>
        </div>
    );
};

const ToastContainer = () => {
    const { toasts, removeToast, confirmState } = useToast();

    return (
        <>
            <div className="toast-container">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onRemove={removeToast}
                    />
                ))}
            </div>
            <ConfirmDialog
                show={confirmState.show}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                type={confirmState.type}
                onConfirm={confirmState.onConfirm}
                onCancel={confirmState.onCancel}
            />
        </>
    );
};

export default ToastContainer;
