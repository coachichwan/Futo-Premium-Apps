import React, { useMemo, useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Item, Transaction, TransactionType, Reseller } from '../types';
import { BoxIcon, WarningIcon, HistoryIcon, ReportIcon, SparklesIcon, UserGroupIcon, TrophyIcon } from './Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import TooltipWrapper from './Tooltip';

interface DashboardProps {
    items: Item[];
    transactions: Transaction[];
    resellers: Reseller[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const [aiInsight, setAiInsight] = useState('');
    const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
    const [forecastData, setForecastData] = useState<any[]>([]);
    const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);

    const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

    const dashboardData = useMemo(() => {
        const totalStock = items.reduce((sum, item) => sum + item.currentStock, 0);
        const lowStockItems = items.filter(item => item.currentStock <= item.minStock);
        
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
                date: dateString,
                Pendapatan: revenue,
            };
        });
        
        const topItems = items.map(item => ({
            name: item.name,
            sales: transactions
                .filter(t => t.itemId === item.id && t.type === TransactionType.OUT)
                .reduce((sum, t) => sum + t.quantity, 0)
        })).filter(item => item.sales > 0)
           .sort((a, b) => b.sales - a.sales)
           .slice(0, 5);

        const topResellers = resellers.map(reseller => ({
            name: reseller.name,
            id: reseller.id,
            sales: transactions
                .filter(t => t.resellerId === reseller.id && t.type === TransactionType.OUT)
                .reduce((sum, t) => sum + t.quantity, 0)
        })).filter(r => r.sales > 0)
           .sort((a, b) => b.sales - a.sales)
           .slice(0, 5);
        
        return {
            totalStock,
            lowStockItems,
            totalRevenue,
            salesTrendData,
            topItems,
            topResellers
        };
    }, [items, transactions, resellers]);
    
    const handleGenerateForecast = async () => {
        setIsGeneratingForecast(true);
        setForecastData([]);
        
        const historicData = dashboardData.salesTrendData.map(d => ({date: d.date, revenue: d.Pendapatan}));
        
        const prompt = `
Based on the following historical daily revenue data for the last 30 days, perform a time-series analysis and provide a 7-day revenue forecast. Consider trends and weekly seasonality if observable.

Historical Data:
${JSON.stringify(historicData)}

Provide the forecast ONLY in a valid JSON array format, with each object containing "date" (YYYY-MM-DD) and "forecast" (a plausible integer revenue). Do not include any explanatory text.
        `.trim();
        
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                date: { type: Type.STRING },
                                forecast: { type: Type.NUMBER },
                            }
                        }
                    }
                }
            });

            const jsonStr = response.text.trim();
            const parsedForecast = JSON.parse(jsonStr);
            
            const formattedForecast = parsedForecast.map((d: any) => ({
                name: new Date(d.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
                date: d.date,
                Prediksi: d.forecast
            }));

            setForecastData(formattedForecast);
            
        } catch (error) {
            console.error("Gemini forecast error:", error);
            // Optionally set feedback for the user
        } finally {
            setIsGeneratingForecast(false);
        }
    };


    const handleGenerateInsight = async () => {
        setIsGeneratingInsight(true);
        setAiInsight('');

        // Calculate today's data specifically for this insight
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const transactionsToday = transactions.filter(t => new Date(t.date) >= todayStart && t.type === TransactionType.OUT);
        
        const todaysRevenue = transactionsToday.reduce((sum, t) => {
            const item = items.find(i => i.id === t.itemId);
            return sum + (item ? parsePrice(item.price) * t.quantity : 0);
        }, 0);

        // FIX: Untyped function calls may not accept type arguments. The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
        // The use of a generic type argument on `reduce` (`reduce<...>()`) was causing a linting/TypeScript error.
        // The fix is to remove the generic from the function call and instead provide a type for the initial value (`{}`),
        // which correctly types the accumulator. This also resolves the downstream arithmetic errors.
        const topItemsToday = transactionsToday.reduce((acc, t) => {
            const item = items.find(i => i.id === t.itemId);
            if (item) {
                const key = item.name;
                acc[key] = (acc[key] || 0) + t.quantity;
            }
            return acc;
        }, {} as Record<string, number>);

        const topItemsTodayString = Object.entries(topItemsToday)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name, sales]) => `${name} (${sales} terjual)`)
            .join(', ') || 'Belum ada penjualan hari ini.';

        const lowStockItemsString = dashboardData.lowStockItems.length > 0
            ? dashboardData.lowStockItems.map(i => `${i.name} (sisa ${i.currentStock})`).join(', ')
            : 'Semua stok aman.';
    
        const prompt = `
Anda adalah seorang analis bisnis AI untuk toko digital "Futo Premium". Berdasarkan data hari ini, berikan ringkasan singkat dan satu insight paling penting yang dapat ditindaklanjuti (actionable) untuk pemilik toko.

Gunakan format berikut, JANGAN tambahkan teks lain di luar format ini:
**Ringkasan Performa Hari Ini:**
- [Tulis ringkasan singkat tentang penjualan dan pendapatan hari ini dalam satu kalimat.]
- [Tulis ringkasan singkat tentang produk terlaris atau status stok dalam satu kalimat.]

**💡 Saran Cerdas:** [Tulis satu saran konkret dan dapat ditindaklanjuti berdasarkan data yang ada. Buatlah kalimat yang memotivasi.]

**Data untuk dianalisis:**
- Pendapatan Hari Ini: ${formatCurrency(todaysRevenue)}
- Produk Terlaris Hari Ini: ${topItemsTodayString}
- Item dengan Stok Menipis Saat Ini: ${lowStockItemsString}
        `.trim();
    
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setAiInsight(response.text);
        } catch (error) {
            console.error("Gemini API error:", error);
            setAiInsight('❌ Gagal menghasilkan insight. Silakan coba lagi.');
        } finally {
            setIsGeneratingInsight(false);
        }
    };
    
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
    
    const combinedChartData = useMemo(() => {
        const allData: Array<{ name: string; date: string; Pendapatan?: number; Prediksi?: number; }> 
            = dashboardData.salesTrendData.map(d => ({ ...d }));

        forecastData.forEach(forecast => {
            const existing = allData.find(d => d.date === forecast.date);
            if(existing) {
                existing.Prediksi = forecast.Prediksi;
            } else {
                allData.push(forecast);
            }
        });
        return allData;
    }, [dashboardData.salesTrendData, forecastData]);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Admin</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card icon={<BoxIcon className="h-8 w-8 text-white" />} title="Total Stok" value={dashboardData.totalStock} color="bg-cyan-500" />
                <Card icon={<WarningIcon className="h-8 w-8 text-white" />} title="Stok Menipis" value={dashboardData.lowStockItems.length} color="bg-yellow-500" />
                <Card icon={<ReportIcon className="h-8 w-8 text-white" />} title="Pendapatan (30 Hari)" value={formatCurrency(dashboardData.totalRevenue)} color="bg-green-500" />
                <Card icon={<HistoryIcon className="h-8 w-8 text-white" />} title="Total Transaksi" value={transactions.length} color="bg-indigo-500" />
            </div>

             {/* AI Insight Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                    <SparklesIcon className="h-6 w-6 mr-2 text-purple-500" />
                    Saran AI
                </h3>
                {isGeneratingInsight ? (
                     <div className="flex items-center justify-center h-24">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                        <p className="ml-3 text-gray-500">Menganalisis data...</p>
                    </div>
                ) : aiInsight ? (
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{aiInsight}</div>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        <p>Klik tombol untuk mendapatkan wawasan bisnis dari AI.</p>
                    </div>
                )}
                 <div className="mt-4 text-center">
                    <button
                        onClick={handleGenerateInsight}
                        disabled={isGeneratingInsight}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center justify-center mx-auto gap-2 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <SparklesIcon className="h-5 w-5" />
                        {isGeneratingInsight ? 'Memproses...' : 'Buat Insight Baru'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                        <ReportIcon className="h-6 w-6 mr-2 text-blue-500" />
                        Tren & Prediksi Pendapatan
                    </h3>
                     <button
                        onClick={handleGenerateForecast}
                        disabled={isGeneratingForecast}
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <SparklesIcon className="h-4 w-4" />
                        {isGeneratingForecast ? 'Memprediksi...' : 'Buat Prediksi 7 Hari'}
                    </button>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                     <ResponsiveContainer>
                        <ComposedChart data={combinedChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                            <Line dataKey="Pendapatan" stroke="#22d3ee" strokeWidth={2} activeDot={{ r: 8 }} dot={false} name="Pendapatan Aktual"/>
                            <Line dataKey="Prediksi" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Prediksi AI"/>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ListCard title="Produk Terlaris" icon={<TrophyIcon className="h-6 w-6 mr-2 text-amber-500" />} hasData={dashboardData.topItems.length > 0} emptyText="Belum ada data penjualan.">
                    {dashboardData.topItems.map((item, index) => (
                        <li key={index} className="py-3 flex justify-between items-center">
                            <p className="font-medium text-gray-800 dark:text-gray-300 truncate pr-4">{item.name}</p>
                            <span className="font-bold text-cyan-500 flex-shrink-0 ml-4">{item.sales} terjual</span>
                        </li>
                    ))}
                </ListCard>
                
                <ListCard title="Reseller Teratas" icon={<UserGroupIcon className="h-6 w-6 mr-2 text-purple-500" />} hasData={dashboardData.topResellers.length > 0} emptyText="Belum ada penjualan dari reseller.">
                    {dashboardData.topResellers.map((reseller, index) => (
                        <li key={reseller.id} className="py-3 flex justify-between items-center">
                            <p className="font-medium text-gray-800 dark:text-gray-300 truncate pr-4">{reseller.name}</p>
                            <span className="font-bold text-cyan-500 flex-shrink-0 ml-4">{reseller.sales} terjual</span>
                        </li>
                    ))}
                </ListCard>

                <div className="lg:col-span-2">
                    <ListCard title="Aktivitas Terakhir" icon={<HistoryIcon className="h-6 w-6 mr-2 text-green-500" />} hasData={transactions.length > 0} emptyText="Belum ada transaksi.">
                        {transactions.slice(0, 5).map(t => {
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
