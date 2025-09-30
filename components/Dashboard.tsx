import React, { useMemo } from 'react';
import { Item, Transaction, TransactionType, Reseller } from '../types';
import { BoxIcon, WarningIcon, HistoryIcon, ReportIcon, TrophyIcon, UserGroupIcon } from './Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
    items: Item[];
    transactions: Transaction[];
    resellers: Reseller[];
}

const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    const numericString = priceStr.replace(/[^0-9]/g, '');
    let value = parseInt(numericString, 10);
    if (priceStr.toLowerCase().includes('k')) {
        value *= 1000;
    }
    return isNaN(value) ? 0 : value;
};

const Dashboard: React.FC<DashboardProps> = ({ items, transactions, resellers }) => {
    
    const dashboardData = useMemo(() => {
        const totalStock = items.reduce((sum, item) => sum + item.currentStock, 0);
        const lowStockItems = items.filter(item => item.currentStock <= item.minStock);
        const recentTransactions = transactions.slice(0, 5);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const transactionsLast30Days = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

        const totalRevenue = transactionsLast30Days
            .filter(t => t.type === TransactionType.OUT)
            .reduce((sum, t) => {
                const item = items.find(i => i.id === t.itemId);
                return sum + (item ? parsePrice(item.price) * t.quantity : 0);
            }, 0);

        const salesTrendData = Array.from({ length: 30 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const dateString = date.toISOString().split('T')[0];
            
            const revenue = transactions
                .filter(t => t.type === TransactionType.OUT && t.date.startsWith(dateString))
                .reduce((sum, t) => {
                     const item = items.find(i => i.id === t.itemId);
                     return sum + (item ? parsePrice(item.price) * t.quantity : 0);
                }, 0);

            return {
                name: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
                Pendapatan: revenue,
            };
        });
        
        const topItems = items.map(item => ({
            ...item,
            sales: transactions
                .filter(t => t.itemId === item.id && t.type === TransactionType.OUT)
                .reduce((sum, t) => sum + t.quantity, 0)
        })).filter(item => item.sales > 0)
           .sort((a, b) => b.sales - a.sales)
           .slice(0, 5);

        const topResellers = resellers.map(reseller => ({
            ...reseller,
            sales: transactions
                .filter(t => t.resellerId === reseller.id && t.type === TransactionType.OUT)
                .reduce((sum, t) => sum + t.quantity, 0)
        })).filter(r => r.sales > 0)
           .sort((a, b) => b.sales - a.sales)
           .slice(0, 5);
        
        return {
            totalStock,
            lowStockItems,
            recentTransactions,
            totalRevenue,
            salesTrendData,
            topItems,
            topResellers
        };
    }, [items, transactions, resellers]);
    
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

    const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

    const ListCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; emptyText: string; hasData: boolean }> = ({ title, icon, children, emptyText, hasData }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-full">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                {icon}
                {title}
            </h3>
            {hasData ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {children}
                </ul>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">{emptyText}</p>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Admin</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card icon={<BoxIcon className="h-8 w-8 text-white" />} title="Total Stok" value={dashboardData.totalStock} color="bg-cyan-500" />
                <Card icon={<WarningIcon className="h-8 w-8 text-white" />} title="Stok Menipis" value={dashboardData.lowStockItems.length} color="bg-yellow-500" />
                <Card icon={<ReportIcon className="h-8 w-8 text-white" />} title="Pendapatan (30 Hari)" value={formatCurrency(dashboardData.totalRevenue)} color="bg-green-500" />
                <Card icon={<HistoryIcon className="h-8 w-8 text-white" />} title="Total Transaksi" value={transactions.length} color="bg-indigo-500" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                    <ReportIcon className="h-6 w-6 mr-2 text-blue-500" />
                    Tren Pendapatan (30 Hari Terakhir)
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                     <ResponsiveContainer>
                        <LineChart data={dashboardData.salesTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="name" tick={{ fill: 'currentColor' }} className="text-xs" />
                            <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} tick={{ fill: 'currentColor' }} className="text-xs" />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(55, 65, 81, 1)', borderRadius: '0.5rem', color: '#ffffff' }}
                                itemStyle={{ color: '#ffffff' }}
                                cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }}
                                formatter={(value) => formatCurrency(value as number)}
                            />
                            <Legend wrapperStyle={{color: 'currentColor'}} />
                            <Line type="monotone" dataKey="Pendapatan" stroke="#22d3ee" strokeWidth={2} activeDot={{ r: 8 }} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                <ListCard title="Stok Menipis" icon={<WarningIcon className="h-6 w-6 mr-2 text-yellow-500" />} hasData={dashboardData.lowStockItems.length > 0} emptyText="Tidak ada item dengan stok menipis.">
                    {dashboardData.lowStockItems.map(item => (
                        <li key={item.id} className="py-3 flex justify-between items-center">
                            <p className="font-medium text-gray-800 dark:text-gray-300 truncate pr-4">{item.name}</p>
                            <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-lg"><span className="text-red-500">{item.currentStock}</span><span className="text-sm font-medium text-gray-500 dark:text-gray-400"> / min {item.minStock}</span></p>
                            </div>
                        </li>
                    ))}
                </ListCard>

                <ListCard title="Produk Terlaris" icon={<TrophyIcon className="h-6 w-6 mr-2 text-amber-500" />} hasData={dashboardData.topItems.length > 0} emptyText="Belum ada data penjualan.">
                    {dashboardData.topItems.map(item => (
                        <li key={item.id} className="py-3 flex justify-between items-center">
                            <p className="font-medium text-gray-800 dark:text-gray-300 truncate pr-4">{item.name}</p>
                            <span className="font-bold text-cyan-500 flex-shrink-0 ml-4">{item.sales} terjual</span>
                        </li>
                    ))}
                </ListCard>

                <ListCard title="Reseller Teratas" icon={<UserGroupIcon className="h-6 w-6 mr-2 text-purple-500" />} hasData={dashboardData.topResellers.length > 0} emptyText="Belum ada penjualan oleh reseller.">
                    {dashboardData.topResellers.map(reseller => (
                        <li key={reseller.id} className="py-3 flex justify-between items-center">
                            <p className="font-medium text-gray-800 dark:text-gray-300 truncate pr-4">{reseller.name}</p>
                            <span className="font-bold text-cyan-500 flex-shrink-0 ml-4">{reseller.sales} terjual</span>
                        </li>
                    ))}
                </ListCard>

                <div className="lg:col-span-2 xl:col-span-3">
                    <ListCard title="Aktivitas Terakhir" icon={<HistoryIcon className="h-6 w-6 mr-2 text-green-500" />} hasData={dashboardData.recentTransactions.length > 0} emptyText="Belum ada transaksi.">
                        {dashboardData.recentTransactions.map(t => {
                            const item = items.find(i => i.id === t.itemId);
                            return (
                                <li key={t.id} className="py-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className={`font-semibold ${t.type === TransactionType.IN ? 'text-green-500' : 'text-red-500'}`}>{t.type === TransactionType.IN ? 'MASUK' : 'KELUAR'}: {t.quantity} {item?.unit}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{item?.name || 'Item Dihapus'}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                    {t.description && <p className="text-sm text-gray-500 mt-1 italic">"{t.description}"</p>}
                                </li>
                            );
                        })}
                    </ListCard>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
