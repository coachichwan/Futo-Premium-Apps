import React from 'react';
import { UserNotification } from '../types';
import { XIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import Tooltip from './Tooltip';

interface UserNotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: UserNotification[];
    onMarkAsRead: (id: number) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: number) => void;
}

const UserNotificationPanel: React.FC<UserNotificationPanelProps> = ({
    isOpen,
    onClose,
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete
}) => {
    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " tahun lalu";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " bulan lalu";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " hari lalu";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " jam lalu";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " menit lalu";
        return "Baru saja";
    };

    return (
        <div 
            className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 shadow-xl rounded-lg border dark:border-gray-700 z-50"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                <h3 className="font-semibold text-lg">Notifikasi</h3>
                {unreadCount > 0 && (
                    <button onClick={onMarkAllAsRead} className="text-xs text-cyan-500 hover:underline">
                        Tandai semua dibaca
                    </button>
                )}
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b dark:border-gray-600 flex items-start gap-3 transition-colors ${!n.read ? 'bg-cyan-50 dark:bg-cyan-500/10' : ''}`}>
                            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.read ? 'bg-transparent' : 'bg-cyan-500'}`}></div>
                            <div className="flex-grow">
                                <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeSince(n.date)}</p>
                            </div>
                            <div className="flex-shrink-0 flex gap-1">
                                {!n.read && (
                                    <Tooltip text="Tandai dibaca">
                                        <button onClick={() => onMarkAsRead(n.id)} className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-800">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500"/>
                                        </button>
                                    </Tooltip>
                                )}
                                <Tooltip text="Hapus notifikasi">
                                    <button onClick={() => onDelete(n.id)} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800">
                                        <XCircleIcon className="h-5 w-5 text-red-500"/>
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="p-6 text-center text-gray-500 dark:text-gray-400">Tidak ada notifikasi.</p>
                )}
            </div>
        </div>
    );
};

export default UserNotificationPanel;