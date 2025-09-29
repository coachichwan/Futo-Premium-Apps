import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Notification, NotificationType } from '../types';

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (message: string, type: NotificationType, itemId?: number) => void;
    removeNotification: (id: number) => void;
    removeNotificationByItemId: (itemId: number) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((message: string, type: NotificationType, itemId?: number) => {
        setNotifications(prev => {
            if (itemId) {
                const existing = prev.find(n => n.itemId === itemId);
                if (existing) {
                    // Jika notifikasi untuk item ini sudah ada, periksa apakah pesannya berbeda
                    if (existing.message === message) {
                        return prev; // Tidak ada perubahan, cegah render ulang
                    }
                    // Pesan berbeda, perbarui
                    return prev.map(n =>
                        n.itemId === itemId ? { ...n, message, type } : n
                    );
                }
            }

            // Jika tidak ada notifikasi yang ada untuk itemId ini, tambahkan yang baru.
            // Juga menangani notifikasi tanpa itemId.
            const newNotification: Notification = {
                id: Date.now() + Math.random(),
                message,
                type,
                itemId,
            };
            return [newNotification, ...prev];
        });
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const removeNotificationByItemId = useCallback((itemId: number) => {
        setNotifications(prev => {
            // Hanya filter jika notifikasi untuk item id tersebut memang ada
            if (prev.some(n => n.itemId === itemId)) {
                return prev.filter(n => n.itemId !== itemId);
            }
            return prev; // Tidak ada perubahan, kembalikan state sebelumnya
        });
    }, []);
    
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, removeNotificationByItemId, clearNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};