import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Item, Transaction, NotificationType, FeedbackMessage, AlertConfigType, Reseller, Discount } from '../types';
import Dashboard from './Dashboard';
import ManageItems from './ManageItems';
import Transactions from './Transactions';
import History from './History';
import Reports from './Reports';
import ManageResellers from './ManageResellers';
import ManageDiscounts from './ManageDiscounts';
import Alert from './Alert';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification } from '../types';
import { BellIcon, DashboardIcon, BoxIcon, TransactionIcon, HistoryIcon, ReportIcon, StoreIcon, WarningIcon, XIcon, UserGroupIcon, SparklesIcon, TicketIcon } from './Icons';
import { ThemeToggle } from './ThemeToggle';
import Tooltip from './Tooltip';
import AiTools from './AiTools';

type StockView = 'dashboard' | 'items' | 'transactions' | 'resellers' | 'discounts' | 'history' | 'reports' | 'ai-tools';

interface StockManagementProps {
    items: Item[];
    transactions: Transaction[];
    resellers: Reseller[];
    discounts: Discount[];
    onAddItem: (itemData: Omit<Item, 'id'>) => void;
    onUpdateItem: (updatedItem: Item) => void;
    onDeleteItem: (itemId: number) => void;
    onAddTransaction: (transactionData: Omit<Transaction, 'id'>) => void;
    onBulkAddItems: (newItems: Omit<Item, 'id'>[]) => void;
    onBulkUpdateItems: (updatedItems: Item[]) => void;
    onAddReseller: (resellerData: Omit<Reseller, 'id' | 'joinDate' | 'status'>) => void;
    onInviteReseller: (inviteData: { name: string; email: string; commissionRate: number; inviteCode: string }) => void;
    onUpdateReseller: (updatedReseller: Reseller) => void;
    onDeleteReseller: (resellerId: number) => void;
    onAddDiscount: (discountData: Omit<Discount, 'id'>) => void;
    onUpdateDiscount: (updatedDiscount: Discount) => void;
    onDeleteDiscount: (discountId: string) => void;
    onSwitchToStore: () => void;
    feedback: FeedbackMessage | null;
    clearFeedback: () => void;
    setFeedback: (feedback: FeedbackMessage | null) => void;
    initialView?: StockView;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'items', label: 'Kelola Item', icon: BoxIcon },
    { id: 'transactions', label: 'Transaksi', icon: TransactionIcon },
    { id: 'resellers', label: 'Reseller', icon: UserGroupIcon },
    { id: 'discounts', label: 'Diskon', icon: TicketIcon },
    { id: 'history', label: 'Riwayat', icon: HistoryIcon },
    { id: 'reports', label: 'Laporan', icon: ReportIcon },
    { id: 'ai-tools', label: 'Layanan AI', icon: SparklesIcon },
];

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const StockManagement: React.FC<StockManagementProps> = ({ initialView = 'dashboard', ...props }) => {
    const [activeView, setActiveView] = useState<StockView>(initialView);
    const { notifications, addNotification, removeNotificationByItemId } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifiedItemIds, setNotifiedItemIds] = useState<Set<number>>(new Set());

    const sendTelegramNotification = useCallback(async (message: string) => {
        try {
            const itemName = message.match(/"([^"]+)"/)?.[1] || 'item';

            const sendTelegramMessageDeclaration: FunctionDeclaration = {
                name: 'sendTelegramMessage',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        message: {
                            type: Type.STRING,
                            description: 'The notification message to send to the admin via Telegram.',
                        },
                    },
                    required: ['message'],
                },
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Trigger a Telegram alert for the store admin with this exact content: "${message}"`,
                config: {
                    tools: [{ functionDeclarations: [sendTelegramMessageDeclaration] }],
                },
            });

            if (response.functionCalls && response.functionCalls.length > 0) {
                const functionCall = response.functionCalls[0];
                if (functionCall.name === 'sendTelegramMessage') {
                    console.log('SIMULATING TELEGRAM NOTIFICATION:', functionCall.args.message);
                    props.setFeedback({
                        type: 'success',
                        message: `Notifikasi Telegram untuk "${itemName}" telah dikirim.`,
                    });
                }
            }
        } catch (error) {
            console.error("Gemini API error during notification:", error);
            props.setFeedback({
                type: 'error',
                message: 'Gagal mengirim notifikasi Telegram via AI.',
            });
        }
    }, [props.setFeedback]);

    const sendEmailNotification = useCallback(async (body: string, subject: string) => {
        try {
            const sendEmailDeclaration: FunctionDeclaration = {
                name: 'sendEmail',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        to: { type: Type.STRING, description: 'The recipient\'s email address.' },
                        subject: { type: Type.STRING, description: 'The subject of the email.' },
                        body: { type: Type.STRING, description: 'The plain text body of the email.' },
                    },
                    required: ['to', 'subject', 'body'],
                },
            };
    
            const prompt = `Send an email notification to the admin at 'admin@futopremium.com' with the subject '${subject}' and the following body: "${body}"`;
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ functionDeclarations: [sendEmailDeclaration] }],
                },
            });
    
            if (response.functionCalls && response.functionCalls.length > 0) {
                const functionCall = response.functionCalls[0];
                if (functionCall.name === 'sendEmail') {
                    console.log('SIMULATING EMAIL NOTIFICATION:', functionCall.args);
                }
            }
        } catch (error) {
            console.error("Gemini API error during email notification simulation:", error);
            props.setFeedback({
                type: 'error',
                message: 'Gagal mensimulasikan pengiriman notifikasi email.',
            });
        }
    }, [props.setFeedback]);


    useEffect(() => {
        const newNotifiedIds = new Set(notifiedItemIds);
        let idsHaveChanged = false;
        
        const newLowStockItems: {item: Item; threshold: number; type: NotificationType}[] = [];

        props.items.forEach(item => {
            const config = item.alertConfig || { type: AlertConfigType.DEFAULT, value: 0 };
            let threshold = item.minStock;
            let isLowStock = false;

            switch (config.type) {
                case AlertConfigType.DISABLED:
                    isLowStock = false;
                    break;
                case AlertConfigType.QUANTITY:
                    threshold = config.value;
                    isLowStock = item.currentStock <= threshold;
                    break;
                case AlertConfigType.PERCENTAGE:
                    threshold = item.minStock > 0 ? Math.floor(item.minStock * (config.value / 100)) : 0;
                    isLowStock = item.currentStock <= threshold;
                    break;
                default: // DEFAULT case
                    threshold = item.minStock;
                    isLowStock = item.currentStock <= threshold;
                    break;
            }

            const hasBeenNotified = notifiedItemIds.has(item.id);

            if (isLowStock && !hasBeenNotified) {
                const messageType = item.currentStock <= 0 ? NotificationType.ERROR : NotificationType.WARNING;
                newLowStockItems.push({ item, threshold, type: messageType });
                
                newNotifiedIds.add(item.id);
                idsHaveChanged = true;
            } 
            else if (!isLowStock && hasBeenNotified) {
                removeNotificationByItemId(item.id);
                newNotifiedIds.delete(item.id);
                idsHaveChanged = true;
            }
            else if (isLowStock && hasBeenNotified) {
                const messageType = item.currentStock <= 0 ? NotificationType.ERROR : NotificationType.WARNING;
                const uiMessage = messageType === NotificationType.ERROR
                    ? `Stok untuk "${item.name}" HABIS!`
                    : `Stok "${item.name}" menipis! Sisa ${item.currentStock} (Batas: ${threshold}).`;
                
                addNotification(uiMessage, messageType, item.id);
            }
        });

        if (newLowStockItems.length > 0) {
            newLowStockItems.forEach(({ item, threshold, type }) => {
                const uiMessage = type === NotificationType.ERROR
                    ? `Stok untuk "${item.name}" HABIS!`
                    : `Stok "${item.name}" menipis! Sisa ${item.currentStock} (Batas: ${threshold}).`;
                addNotification(uiMessage, type, item.id);
            });

            const batchTelegramMessage = `PERINGATAN STOK RENDAH:\n` + newLowStockItems.map(({ item, type }) => 
                `- ${item.name}: ${type === NotificationType.ERROR ? 'STOK HABIS' : `Sisa ${item.currentStock}`}`
            ).join('\n') + `\n\nSegera lakukan restock.`;

            const batchEmailBody = `The following items are low in stock or have run out:\n\n` + newLowStockItems.map(({ item, threshold, type }) =>
                `Item: ${item.name}\nStatus: ${type === NotificationType.ERROR ? 'CRITICAL (Out of Stock)' : 'LOW'}\nCurrent Stock: ${item.currentStock}\nThreshold: ${threshold}\n---`
            ).join('\n\n') + `\n\nPlease restock these items soon.`;
            
            const batchEmailSubject = newLowStockItems.length > 1
                ? `Multiple Low Stock Alerts (${newLowStockItems.length} items)`
                : `Low Stock Alert: ${newLowStockItems[0].item.name}`;

            sendTelegramNotification(batchTelegramMessage);
            sendEmailNotification(batchEmailBody, batchEmailSubject);
        }

        if (idsHaveChanged) {
            setNotifiedItemIds(newNotifiedIds);
        }
    }, [props.items, addNotification, removeNotificationByItemId, notifiedItemIds, sendTelegramNotification, sendEmailNotification]);


    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard items={props.items} transactions={props.transactions} resellers={props.resellers} />;
            case 'items':
                return <ManageItems items={props.items} onAddItem={props.onAddItem} onUpdateItem={props.onUpdateItem} onDeleteItem={props.onDeleteItem} onBulkAddItems={props.onBulkAddItems} setFeedback={props.setFeedback} />;
            case 'transactions':
                return <Transactions items={props.items} resellers={props.resellers} onAddTransaction={props.onAddTransaction} />;
            case 'resellers':
                return <ManageResellers 
                            resellers={props.resellers} 
                            transactions={props.transactions}
                            onAddReseller={props.onAddReseller} 
                            onInviteReseller={props.onInviteReseller}
                            onUpdateReseller={props.onUpdateReseller} 
                            onDeleteReseller={props.onDeleteReseller} 
                            setFeedback={props.setFeedback}
                       />;
            case 'discounts':
                return <ManageDiscounts 
                            discounts={props.discounts}
                            onAddDiscount={props.onAddDiscount}
                            onUpdateDiscount={props.onUpdateDiscount}
                            onDeleteDiscount={props.onDeleteDiscount}
                        />;
            case 'history':
                return <History items={props.items} transactions={props.transactions} resellers={props.resellers} />;
            case 'reports':
                return <Reports items={props.items} transactions={props.transactions} resellers={props.resellers} />;
            case 'ai-tools':
                return <AiTools items={props.items} onBulkUpdateItems={props.onBulkUpdateItems} setFeedback={props.setFeedback} />;
            default:
                return <Dashboard items={props.items} transactions={props.transactions} resellers={props.resellers} />;
        }
    };

    const currentViewLabel = navItems.find(item => item.id === activeView)?.label || 'Dashboard';


    const NotificationPanel: React.FC<{notifs: Notification[], onRemove: (id: number) => void, onClose: () => void}> = ({ notifs, onRemove, onClose }) => (
        <div className="absolute top-16 right-0 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg border dark:border-gray-700 z-50">
            <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                <h3 className="font-semibold">Notifikasi</h3>
                <Tooltip text="Tutup Notifikasi">
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                      <XIcon className="h-5 w-5"/>
                  </button>
                </Tooltip>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifs.length > 0 ? notifs.map(n => (
                    <div key={n.id} className="p-4 border-b dark:border-gray-700 flex items-start gap-3">
                        <WarningIcon className={`h-6 w-6 ${n.type === NotificationType.ERROR ? 'text-red-500' : 'text-yellow-500'} mt-1 flex-shrink-0`} />
                        <div className="flex-grow">
                            <p className="text-sm">{n.message}</p>
                        </div>
                         <Tooltip text="Hapus notifikasi ini">
                           <button onClick={() => removeNotificationByItemId(n.itemId!)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                             <XIcon className="h-4 w-4"/>
                          </button>
                         </Tooltip>
                    </div>
                )) : <p className="p-4 text-center text-gray-500">Tidak ada notifikasi baru.</p>}
            </div>
        </div>
    );
    

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 print:bg-white">
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex-col fixed inset-y-0 left-0 z-10 hidden lg:flex print:hidden">
                <div className="p-6 text-2xl font-bold text-cyan-500 border-b dark:border-gray-700">
                    Futo Stok
                </div>
                <nav className="flex-grow">
                    <ul>
                        {navItems.map(item => (
                            <li key={item.id}>
                                <button
                                    onClick={() => setActiveView(item.id as StockView)}
                                    className={`w-full flex items-center px-6 py-4 text-left transition-colors duration-200 ${activeView === item.id ? 'bg-cyan-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <item.icon className="h-6 w-6 mr-4" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                 <div className="p-4 border-t dark:border-gray-700">
                    <button
                        onClick={props.onSwitchToStore}
                        className="w-full flex items-center px-4 py-3 text-left text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    >
                        <StoreIcon className="h-6 w-6 mr-4" />
                        <span>Kembali ke Toko</span>
                    </button>
                </div>
            </aside>
            <main className="lg:ml-64 p-4 md:p-8 lg:pb-8 overflow-auto relative print:ml-0 print:p-0">
                 <header className="flex justify-between items-center mb-8 print:hidden lg:hidden">
                    <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200 lg:hidden">
                        {currentViewLabel}
                    </h1>
                    <div className="flex items-center gap-2 md:gap-4">
                        <ThemeToggle />
                        <div className="relative">
                            <button onClick={() => setShowNotifications(s => !s)} className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full">
                                <BellIcon className="h-6 w-6"/>
                                {notifications.length > 0 && <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>}
                            </button>
                            {showNotifications && <NotificationPanel notifs={notifications} onRemove={(id) => removeNotificationByItemId(notifications.find(n=>n.id === id)?.itemId!)} onClose={() => setShowNotifications(false)} />}
                        </div>
                    </div>
                </header>

                {/* Mobile Tab Navigation */}
                <div className="lg:hidden mb-6 -mx-4 px-4 sm:-mx-8 sm:px-8">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id as StockView)}
                                    className={`${
                                        activeView === item.id
                                            ? 'border-cyan-500 text-cyan-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                 {props.feedback && (
                    <div className="fixed lg:absolute top-4 lg:top-8 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4 lg:px-0 print:hidden">
                        <Alert 
                            type={props.feedback.type} 
                            message={props.feedback.message}
                            onDismiss={props.clearFeedback} 
                        />
                    </div>
                )}
                {renderView()}
            </main>
        </div>
    );
};

export default StockManagement;