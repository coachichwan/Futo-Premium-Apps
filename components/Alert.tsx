import React from 'react';
import { FeedbackMessage } from '../types';
import { CheckCircleIcon, XCircleIcon, XIcon } from './Icons';

interface AlertProps extends FeedbackMessage {
    onDismiss: () => void;
}

const alertConfig = {
    success: {
        bg: 'bg-green-100 dark:bg-green-900',
        border: 'border-green-400 dark:border-green-600',
        text: 'text-green-800 dark:text-green-100',
        icon: <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400" />
    },
    error: {
        bg: 'bg-red-100 dark:bg-red-900',
        border: 'border-red-400 dark:border-red-600',
        text: 'text-red-800 dark:text-red-100',
        icon: <XCircleIcon className="h-6 w-6 text-red-500 dark:text-red-400" />
    }
};


const Alert: React.FC<AlertProps> = ({ type, message, onDismiss }) => {
    const config = alertConfig[type];

    return (
        <div className={`w-full p-4 border-l-4 rounded-r-lg shadow-lg flex items-center justify-between ${config.bg} ${config.border} ${config.text}`} role="alert">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    {config.icon}
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium">{message}</p>
                </div>
            </div>
            <button 
                onClick={onDismiss} 
                className={`ml-4 p-1.5 rounded-full ${config.bg} hover:bg-opacity-80`}
                aria-label="Dismiss"
            >
                <XIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

export default Alert;