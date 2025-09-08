import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
    show,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'warning' // 'warning', 'danger', 'info'
}) => {
    if (!show) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return '⚠';
            case 'info':
                return 'ℹ';
            case 'warning':
            default:
                return '?';
        }
    };

    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-dialog-header">
                    <div className={`confirm-dialog-icon confirm-dialog-${type}`}>
                        {getIcon()}
                    </div>
                    <h3 className="confirm-dialog-title">{title}</h3>
                </div>

                <div className="confirm-dialog-body">
                    <p className="confirm-dialog-message">{message}</p>
                </div>

                <div className="confirm-dialog-footer">
                    <button
                        className="confirm-dialog-btn confirm-dialog-btn-cancel"
                        onClick={onCancel}
                        type="button"
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`confirm-dialog-btn confirm-dialog-btn-confirm confirm-dialog-btn-${type}`}
                        onClick={onConfirm}
                        type="button"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
