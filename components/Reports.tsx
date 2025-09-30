import React, { useRef, useMemo } from 'react';
import { Item, Transaction, TransactionType, Reseller } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PrintIcon, DownloadIcon } from './Icons';
import CustomTooltip from './Tooltip';

interface ReportsProps {
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


const Reports: React.FC<ReportsProps> = ({ items, transactions, resellers }) => {
    
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const totalIn = transactions
        .filter(t => t.type === TransactionType.IN)
        .reduce((sum, t) => sum + t.quantity, 0);

    const totalOut = transactions
        .filter(t => t.type === TransactionType.OUT)
        .reduce((sum, t) => sum + t.quantity, 0);
        
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const totalRevenueLast30Days = transactions
        .filter(t => t.type === TransactionType.OUT && new Date(t.date) >= thirtyDaysAgo)
        .reduce((sum, t) => {
            const item = items.find(i => i.id === t.itemId);
            if (!item) return sum;
            const price = parsePrice(item.price);
            return sum + (price * t.quantity);
        }, 0);

    const popularItems = [...items].sort((a, b) => {
        const salesA = transactions.filter(t => t.itemId === a.id && t.type === TransactionType.OUT).reduce((sum, t) => sum + t.quantity, 0);
        const salesB = transactions.filter(t => t.itemId === b.id && t.type === TransactionType.OUT).reduce((sum, t) => sum + t.quantity, 0);
        return salesB - salesA;
    }).slice(0, 5);

    const salesTrendData = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateString = date.toISOString().split('T')[0];
        
        const totalSales = transactions
            .filter(t => t.type === TransactionType.OUT && t.date.startsWith(dateString))
            .reduce((sum, t) => sum + t.quantity, 0);

        return {
            name: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
            penjualan: totalSales,
        };
    });
    
    const topResellers = resellers.map(reseller => {
        const sales = transactions
            .filter(t => t.resellerId === reseller.id && t.type === TransactionType.OUT)
            .reduce((sum, t) => sum + t.quantity, 0);
        return { ...reseller, sales };
    }).sort((a, b) => b.sales - a.sales).slice(0, 5);
    

    const handleExportHTML = () => {
        const svgElement = chartContainerRef.current?.querySelector('svg');
        if (!svgElement) {
            alert('Tidak dapat menemukan grafik untuk diekspor.');
            return;
        }

        if (!svgElement.getAttribute('xmlns')) {
            svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
        const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;
        
        const reportDate = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' });

        const popularItemsWithSales = popularItems.map(item => ({
            name: item.name,
            sales: transactions
                .filter(t => t.itemId === item.id && t.type === TransactionType.OUT)
                .reduce((sum, t) => sum + t.quantity, 0)
        }));

        const card = (title: string, content: string) => `
            <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">${title}</h3>
                ${content}
            </div>
        `;

        
        const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Futo Premium</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { font-family: 'Inter', sans-serif; }</style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <div class="container mx-auto p-8 max-w-5xl">
        <header class="mb-8 border-b pb-4">
            <h1 class="text-4xl font-bold text-gray-800">Laporan Penjualan</h1>
            <p class="text-gray-500">Futo Premium Store & Inventory</p>
            <p class="text-sm text-gray-500 mt-1">Dibuat pada: ${reportDate}</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            ${card('Ringkasan Transaksi', `
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Total Stok Masuk:</span>
                        <span class="font-bold text-green-600">${totalIn}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Total Stok Keluar:</span>
                        <span class="font-bold text-red-600">${totalOut}</span>
                    </div>
                </div>
            `)}
             ${card('Total Pendapatan (30 Hari)', `
                <p class="text-3xl font-bold text-green-600">
                    Rp ${totalRevenueLast30Days.toLocaleString('id-ID')}
                </p>
            `)}
             ${card('Item Terlaris', popularItemsWithSales.length > 0 ? `
                <ul class="divide-y divide-gray-200">
                    ${popularItemsWithSales.map(item => `
                        <li class="py-2 flex justify-between items-start">
                            <span class="font-medium text-gray-800 text-sm">${item.name}</span>
                            <span class="font-bold text-cyan-600 flex-shrink-0 ml-4 text-sm">${item.sales} terjual</span>
                        </li>
                    `).join('')}
                </ul>
            ` : `<p class="text-gray-500">Belum ada data penjualan.</p>`)}
            ${card('Reseller Teratas', topResellers.length > 0 ? `
                <ul class="divide-y divide-gray-200">
                     ${topResellers.map(reseller => `
                        <li class="py-2 flex justify-between items-start">
                            <span class="font-medium text-gray-800 text-sm">${reseller.name}</span>
                            <span class="font-bold text-cyan-600 flex-shrink-0 ml-4 text-sm">${reseller.sales} terjual</span>
                        </li>
                    `).join('')}
                </ul>
            ` : `<p class="text-gray-500">Belum ada penjualan oleh reseller.</p>`)}
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 class="text-xl font-semibold text-gray-800 mb-4">Tren Penjualan (7 Hari Terakhir)</h3>
            <img src="${svgUrl}" alt="Grafik Tren Penjualan" class="w-full">
        </div>
    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-futo-premium-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 print:bg-white print:text-black">
            <div className="flex justify-between items-center print:hidden">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white print:text-black">Laporan</h2>
                <div className="flex items-center gap-2">
                    <CustomTooltip text="Ekspor sebagai file HTML">
                        <button 
                            onClick={handleExportHTML}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <DownloadIcon className="h-5 w-5" />
                            <span>Export HTML</span>
                        </button>
                    </CustomTooltip>
                    <CustomTooltip text="Cetak Laporan">
                        <button 
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                        >
                            <PrintIcon className="h-5 w-5" />
                            <span>Cetak</span>
                        </button>
                    </CustomTooltip>
                </div>
            </div>
             <h2 className="text-3xl font-bold text-gray-800 dark:text-white print:text-black hidden print:block mb-4">Laporan Penjualan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg print:shadow-none print:border print:border-gray-300">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 print:text-black">Ringkasan Transaksi</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400 print:text-black">Total Stok Masuk:</span>
                            <span className="font-bold text-green-500 print:text-black">{totalIn}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400 print:text-black">Total Stok Keluar:</span>
                            <span className="font-bold text-red-500 print:text-black">{totalOut}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg print:shadow-none print:border print:border-gray-300">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 print:text-black">Total Pendapatan (30 Hari)</h3>
                    <p className="text-3xl font-bold text-green-500 print:text-black">
                        Rp {totalRevenueLast30Days.toLocaleString('id-ID')}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg print:shadow-none print:border print:border-gray-300">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 print:text-black">Item Terlaris</h3>
                    {popularItems.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
                            {popularItems.map(item => {
                                const sales = transactions
                                    .filter(t => t.itemId === item.id && t.type === TransactionType.OUT)
                                    .reduce((sum, t) => sum + t.quantity, 0);
                                return (
                                    <li key={item.id} className="py-2">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-gray-800 dark:text-gray-300 print:text-black text-sm">{item.name}</span>
                                            <span className="font-bold text-cyan-500 print:text-black flex-shrink-0 ml-4 text-sm">{sales} terjual</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                         <p className="text-gray-500 dark:text-gray-400 print:text-black">Belum ada data penjualan.</p>
                    )}
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg print:shadow-none print:border print:border-gray-300">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 print:text-black">Reseller Teratas</h3>
                    {topResellers.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
                            {topResellers.map(reseller => (
                                <li key={reseller.id} className="py-2">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-gray-800 dark:text-gray-300 print:text-black text-sm">{reseller.name}</span>
                                        <span className="font-bold text-cyan-500 print:text-black flex-shrink-0 ml-4 text-sm">{reseller.sales} terjual</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-gray-500 dark:text-gray-400 print:text-black">Belum ada penjualan oleh reseller.</p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg print:shadow-none print:border print:border-gray-300">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 print:text-black">Tren Penjualan (7 Hari Terakhir)</h3>
                <div style={{ width: '100%', height: 300 }} ref={chartContainerRef}>
                    <ResponsiveContainer>
                        <LineChart
                            data={salesTrendData}
                            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="name" tick={{ fill: 'currentColor' }} className="text-xs print:text-black" />
                            <YAxis allowDecimals={false} tick={{ fill: 'currentColor' }} className="text-xs print:text-black" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.9)', // bg-gray-900
                                    borderColor: 'rgba(55, 65, 81, 1)', // border-gray-600
                                    borderRadius: '0.5rem', // rounded-lg
                                    color: '#ffffff'
                                }}
                                itemStyle={{ color: '#ffffff' }}
                                cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                            <Legend wrapperStyle={{color: 'currentColor'}} />
                            <Line type="monotone" dataKey="penjualan" name="Jumlah Terjual" stroke="#22d3ee" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Reports;