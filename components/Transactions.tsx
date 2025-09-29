import React, { useState } from 'react';
import { Item, Transaction, TransactionType, Reseller } from '../types';
import { PlusIcon } from './Icons';

interface TransactionsProps {
    items: Item[];
    resellers: Reseller[];
    onAddTransaction: (transactionData: Omit<Transaction, 'id'>) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ items, resellers, onAddTransaction }) => {
    const [transactionData, setTransactionData] = useState({
        itemId: items.length > 0 ? items[0].id : 0,
        type: TransactionType.OUT,
        quantity: 1,
        description: '',
        resellerId: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTransactionData(prev => ({
            ...prev,
            [name]: (name === 'quantity' || name === 'itemId' || name === 'resellerId') ? (value ? parseInt(value, 10) : '') : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactionData.itemId) {
            alert('Silakan pilih item.');
            return;
        }

        const dataToSend: Omit<Transaction, 'id'> = {
            itemId: transactionData.itemId,
            type: transactionData.type,
            quantity: transactionData.quantity,
            description: transactionData.description,
            date: new Date().toISOString(),
        };

        if (transactionData.type === TransactionType.OUT && transactionData.resellerId) {
             dataToSend.resellerId = Number(transactionData.resellerId);
        }

        onAddTransaction(dataToSend);
        
        // Reset form
        setTransactionData({
            itemId: items.length > 0 ? items[0].id : 0,
            type: TransactionType.OUT,
            quantity: 1,
            description: '',
            resellerId: '',
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Tambah Transaksi</h2>
            <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item</label>
                        <select
                            id="itemId"
                            name="itemId"
                            value={transactionData.itemId}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                            {items.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe Transaksi</label>
                        <select
                            id="type"
                            name="type"
                            value={transactionData.type}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value={TransactionType.IN}>Stok Masuk</option>
                            <option value={TransactionType.OUT}>Stok Keluar</option>
                        </select>
                    </div>

                    {transactionData.type === TransactionType.OUT && (
                         <div>
                            <label htmlFor="resellerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reseller (Opsional)</label>
                            <select
                                id="resellerId"
                                name="resellerId"
                                value={transactionData.resellerId}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="">-- Pilih Reseller --</option>
                                {resellers.map(reseller => (
                                    <option key={reseller.id} value={reseller.id}>{reseller.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={transactionData.quantity}
                            onChange={handleInputChange}
                            min="1"
                            required
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan (Opsional)</label>
                        <textarea
                            id="description"
                            name="description"
                            value={transactionData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <button type="submit" className="w-full px-4 py-3 bg-cyan-500 text-white rounded-lg flex items-center justify-center font-semibold">
                        <PlusIcon className="h-5 w-5 mr-2" /> Tambah Transaksi
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Transactions;