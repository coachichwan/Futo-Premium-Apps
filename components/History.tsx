import React from 'react';
import { Item, Transaction, TransactionType, Reseller } from '../types';

interface HistoryProps {
    items: Item[];
    transactions: Transaction[];
    resellers: Reseller[];
}

const History: React.FC<HistoryProps> = ({ items, transactions, resellers }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Riwayat Transaksi</h2>
            <div className="bg-transparent md:bg-white md:dark:bg-gray-800 md:shadow-lg md:rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 hidden md:table-header-group">
                            <tr>
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Item</th>
                                <th className="p-4">Tipe</th>
                                <th className="p-4">Jumlah</th>
                                <th className="p-4">Reseller</th>
                                <th className="p-4">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group">
                            {transactions.map(t => {
                                const item = items.find(i => i.id === t.itemId);
                                const reseller = resellers.find(r => r.id === t.resellerId);
                                return (
                                    <tr key={t.id} className="block md:table-row border-b dark:border-gray-700 md:border-b last:border-b-0 mb-4 md:mb-0 p-4 md:p-0 rounded-lg md:rounded-none shadow-md md:shadow-none bg-white dark:bg-gray-800">
                                        <td className="flex justify-between items-center md:table-cell text-gray-600 dark:text-gray-400 whitespace-nowrap pb-2 md:pb-0 md:p-4">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 md:hidden">Tanggal</span>
                                            {new Date(t.date).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="flex justify-between items-center md:table-cell font-medium text-gray-800 dark:text-gray-200 py-2 md:py-0 md:p-4 border-t md:border-t-0 dark:border-gray-700">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 md:hidden">Item</span>
                                            {item?.name || 'Item Dihapus'}
                                        </td>
                                        <td className="flex justify-between items-center md:table-cell py-2 md:py-0 md:p-4 border-t md:border-t-0 dark:border-gray-700">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 md:hidden">Tipe</span>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.type === TransactionType.IN ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                {t.type === TransactionType.IN ? 'MASUK' : 'KELUAR'}
                                            </span>
                                        </td>
                                        <td className="flex justify-between items-center md:table-cell font-bold py-2 md:py-0 md:p-4 border-t md:border-t-0 dark:border-gray-700">
                                             <span className="font-bold text-gray-700 dark:text-gray-300 md:hidden">Jumlah</span>
                                            {t.quantity}
                                        </td>
                                        <td className="flex justify-between items-center md:table-cell text-gray-600 dark:text-gray-400 py-2 md:py-0 md:p-4 border-t md:border-t-0 dark:border-gray-700">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 md:hidden">Reseller</span>
                                            {reseller?.name || '-'}
                                        </td>
                                        <td className="flex justify-between items-center md:table-cell text-gray-600 dark:text-gray-400 pt-2 md:pt-0 md:p-4 border-t md:border-t-0 dark:border-gray-700">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 md:hidden">Keterangan</span>
                                            <span className="italic">{t.description || '-'}</span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                 {transactions.length === 0 && (
                    <p className="p-6 text-center text-gray-500 dark:text-gray-400">Belum ada riwayat transaksi.</p>
                )}
            </div>
        </div>
    );
};

export default History;