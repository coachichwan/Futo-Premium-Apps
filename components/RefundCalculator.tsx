import React, { useState, useMemo } from 'react';
import { Item, Transaction, TransactionType } from '../types';
import { StoreIcon, CalculatorIcon, SaveIcon } from './Icons';

interface RefundCalculatorProps {
    items: Item[];
    onAddTransaction: (transactionData: Omit<Transaction, 'id'|'date'> & {date?: string}) => void;
    onSwitchToStore: () => void;
}

const RefundCalculator: React.FC<RefundCalculatorProps> = ({ items, onAddTransaction, onSwitchToStore }) => {
    const [selectedItemId, setSelectedItemId] = useState<number | ''>(items.length > 0 ? items[0].id : '');
    const [purchasePrice, setPurchasePrice] = useState<number>(0);
    const [daysUsed, setDaysUsed] = useState<number>(0);
    const [subscriptionDays, setSubscriptionDays] = useState<number>(30);
    
    const refundAmount = useMemo(() => {
        if (purchasePrice <= 0 || subscriptionDays <= 0 || daysUsed < 0) {
            return 0;
        }
        if (daysUsed >= subscriptionDays) {
            return 0;
        }
        const dailyRate = purchasePrice / subscriptionDays;
        const refund = Math.round(dailyRate * (subscriptionDays - daysUsed));
        return refund;
    }, [purchasePrice, daysUsed, subscriptionDays]);

    const handleRecordTransaction = () => {
        if (!selectedItemId) {
            alert('Pilih item terlebih dahulu.');
            return;
        }
        const item = items.find(i => i.id === selectedItemId);
        onAddTransaction({
            itemId: selectedItemId,
            type: TransactionType.IN,
            quantity: 1,
            description: `Refund dari pelanggan. Harga beli: ${purchasePrice}, pakai: ${daysUsed} hari. Refund: ${refundAmount}`,
            date: new Date().toISOString()
        });
        alert(`Transaksi refund untuk ${item?.name} berhasil dicatat sebagai stok masuk.`);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
             <div className="container mx-auto px-6 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
                        <CalculatorIcon className="h-10 w-10"/> Kalkulator Refund
                    </h2>
                    <button 
                        onClick={onSwitchToStore}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                        <StoreIcon className="h-5 w-5" />
                        <span>Kembali ke Toko</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Item</label>
                            <select 
                                value={selectedItemId} 
                                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            >
                                {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Beli Pelanggan (Rp)</label>
                            <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Contoh: 25000" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Masa Langganan (Hari)</label>
                            <input type="number" value={subscriptionDays} onChange={e => setSubscriptionDays(Number(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sudah Dipakai (Hari)</label>
                            <input type="number" value={daysUsed} onChange={e => setDaysUsed(Number(e.target.value))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Contoh: 10" />
                        </div>
                    </div>

                    <div className="bg-cyan-500 text-white p-8 rounded-lg shadow-lg flex flex-col justify-center items-center text-center">
                        <h3 className="text-2xl font-semibold mb-2">Jumlah Refund</h3>
                        <p className="text-6xl font-bold mb-6">
                            Rp {refundAmount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-cyan-100 max-w-sm mb-6">
                            Jumlah ini adalah estimasi pengembalian dana kepada pelanggan berdasarkan sisa masa aktif langganan.
                        </p>
                        {selectedItemId && (
                            <button 
                                onClick={handleRecordTransaction}
                                className="w-full max-w-xs px-4 py-3 bg-white text-cyan-600 rounded-lg flex items-center justify-center font-semibold hover:bg-gray-100 transition-colors"
                                disabled={refundAmount <= 0}
                            >
                                <SaveIcon className="h-5 w-5 mr-2" /> Catat Sebagai Stok Masuk
                            </button>
                        )}
                    </div>
                </div>

             </div>
        </div>
    );
};

export default RefundCalculator;