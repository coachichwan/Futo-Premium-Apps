import React from 'react';
import { Item, Transaction, TransactionType } from '../types';
import { BoxIcon, WarningIcon, HistoryIcon, ReportIcon } from './Icons';

interface DashboardProps {
    items: Item[];
    transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ items, transactions }) => {
    const totalStock = items.reduce((sum, item) => sum + item.currentStock, 0);
    const lowStockItems = items.filter(item => item.currentStock <= item.minStock);
    const recentTransactions = transactions.slice(0, 5);

    // Calculate totals for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const transactionsLast7Days = transactions.filter(t => new Date(t.date) >= sevenDaysAgo);

    const totalInLast7Days = transactionsLast7Days
        .filter(t => t.type === TransactionType.IN)
        .reduce((sum, t) => sum + t.quantity, 0);

    const totalOutLast7Days = transactionsLast7Days
        .filter(t => t.type === TransactionType.OUT)
        .reduce((sum, t) => sum + t.quantity, 0);


    const Card: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
        <div className={`p-6 rounded-lg shadow-lg ${color}`}>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-white bg-opacity-30">
                    {icon}
                </div>
                <div className="ml-4">
                    <p className="text-lg font-semibold text-white">{title}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card icon={<BoxIcon className="h-8 w-8 text-white" />} title="Total Stok" value={totalStock} color="bg-cyan-500" />
                <Card icon={<WarningIcon className="h-8 w-8 text-white" />} title="Stok Menipis" value={lowStockItems.length} color="bg-yellow-500" />
                <Card icon={<HistoryIcon className="h-8 w-8 text-white" />} title="Total Transaksi" value={transactions.length} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                        <WarningIcon className="h-6 w-6 mr-2 text-yellow-500" />
                        Stok Menipis
                    </h3>
                    {lowStockItems.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {lowStockItems.map(item => (
                                <li key={item.id} className="py-3 flex justify-between items-center">
                                    <p className="font-medium text-gray-800 dark:text-gray-300 truncate pr-4">{item.name}</p>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-semibold text-lg">
                                            <span className="text-red-500">{item.currentStock}</span>
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400"> / min {item.minStock}</span>
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">Tidak ada item dengan stok menipis.</p>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                        <HistoryIcon className="h-6 w-6 mr-2 text-green-500" />
                        Aktivitas Terakhir
                    </h3>
                    {recentTransactions.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {recentTransactions.map(t => {
                                const item = items.find(i => i.id === t.itemId);
                                return (
                                    <li key={t.id} className="py-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className={`font-semibold ${t.type === TransactionType.IN ? 'text-green-500' : 'text-red-500'}`}>
                                                    {t.type === TransactionType.IN ? 'MASUK' : 'KELUAR'}: {t.quantity} {item?.unit}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{item?.name || 'Item Dihapus'}</p>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                                        </div>
                                        {t.description && <p className="text-sm text-gray-500 mt-1 italic">"{t.description}"</p>}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">Belum ada transaksi.</p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                    <ReportIcon className="h-6 w-6 mr-2 text-blue-500" />
                    Ringkasan 7 Hari Terakhir
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <p className="font-medium text-gray-800 dark:text-gray-300">Total Item Masuk</p>
                        <p className="font-semibold text-lg text-green-500">
                            +{totalInLast7Days}
                        </p>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <p className="font-medium text-gray-800 dark:text-gray-300">Total Item Keluar</p>
                        <p className="font-semibold text-lg text-red-500">
                            -{totalOutLast7Days}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;