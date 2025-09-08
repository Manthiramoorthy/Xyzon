import React from 'react';
import { useToast } from '../context/ToastContext';
import './ToastDemo.css';

export default function ToastDemo() {
    const { toast, confirm } = useToast();

    const handleSuccess = () => {
        toast.success('Operation completed successfully!');
    };

    const handleError = () => {
        toast.error('Something went wrong. Please try again.');
    };

    const handleWarning = () => {
        toast.warning('Please review your input before proceeding.');
    };

    const handleInfo = () => {
        toast.info('Here is some helpful information.');
    };

    const handleConfirm = async () => {
        const confirmed = await confirm('Are you sure you want to delete this item?');
        if (confirmed) {
            toast.success('Item deleted successfully!');
        } else {
            toast.info('Delete cancelled.');
        }
    };

    const handleDangerousAction = async () => {
        const confirmed = await confirm(
            'This action cannot be undone. Are you sure you want to permanently delete all data?',
            'Confirm Dangerous Action'
        );
        if (confirmed) {
            toast.error('All data has been permanently deleted!');
        }
    };

    return (
        <div className="toast-demo">
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="mb-0">Custom Toast & Confirmation Demo</h3>
                            </div>
                            <div className="card-body">
                                <p className="text-muted mb-4">
                                    Click the buttons below to test the custom toast notifications and confirmation dialogs.
                                </p>

                                <div className="mb-4">
                                    <h5>Toast Notifications</h5>
                                    <div className="d-flex flex-wrap gap-2">
                                        <button
                                            className="btn btn-success"
                                            onClick={handleSuccess}
                                        >
                                            Success Toast
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={handleError}
                                        >
                                            Error Toast
                                        </button>
                                        <button
                                            className="btn btn-warning"
                                            onClick={handleWarning}
                                        >
                                            Warning Toast
                                        </button>
                                        <button
                                            className="btn btn-info"
                                            onClick={handleInfo}
                                        >
                                            Info Toast
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h5>Confirmation Dialogs</h5>
                                    <div className="d-flex flex-wrap gap-2">
                                        <button
                                            className="btn btn-outline-danger"
                                            onClick={handleConfirm}
                                        >
                                            Delete Item
                                        </button>
                                        <button
                                            className="btn btn-outline-dark"
                                            onClick={handleDangerousAction}
                                        >
                                            Dangerous Action
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-light rounded">
                                    <h6>Features:</h6>
                                    <ul className="mb-0">
                                        <li>✅ Custom toast notifications (success, error, warning, info)</li>
                                        <li>✅ Confirmation dialogs with async/await support</li>
                                        <li>✅ High z-index ensures visibility above all content</li>
                                        <li>✅ Auto-dismiss after 5 seconds</li>
                                        <li>✅ Click to dismiss manually</li>
                                        <li>✅ Smooth animations</li>
                                        <li>✅ Accessible design</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
