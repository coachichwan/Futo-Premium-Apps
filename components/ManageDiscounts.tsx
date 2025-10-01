import React, { useState, useMemo } from 'react';
import { Discount } from '../types';
import { PlusIcon, SaveIcon, TicketIcon, TrashIcon } from './Icons';
import Tooltip from './Tooltip';

interface ManageDiscountsProps {
    discounts: Discount[];
    onAddDiscount: (discountData: Omit<Discount, 'id'>) => void;
    onUpdateDiscount: (updatedDiscount: Discount) => void;
    onDeleteDiscount: (discountId: string) => void;
}

const ManageDiscounts: React.FC<ManageDiscountsProps> = ({ discounts, onAddDiscount, onUpdateDiscount, onDeleteDiscount }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const initialFormState: Omit<Discount, 'id'> = {
        code: '',
        type: 'percentage',
        value: 10,
        minPurchase: 0,
        isActive: true,
    };
    const [formState, setFormState] = useState<Omit<Discount, 'id'>>(initialFormState);
    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: any = value;
        if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        } else if (name === 'value' || name === 'minPurchase') {
            processedValue = parseFloat(value) || 0;
        } else if (name === 'code') {
            processedValue = value.toUpperCase();
        }

        if (editingDiscount) {
            setEditingDiscount({ ...editingDiscount, [name]: processedValue });
        } else {
            setFormState({ ...formState, [name]: processedValue });
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddDiscount(formState);
        setFormState(initialFormState);
        setIsAdding(false);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDiscount) {
            onUpdateDiscount(editingDiscount);
            setEditingDiscount(null);
        }
    };

    const startEditing = (discount: Discount) => {
        setEditingDiscount({ ...discount });
        setIsAdding(false);
    };

    const handleToggleActive = (discount: Discount) => {
        onUpdateDiscount({ ...discount, isActive: !discount.isActive });
    };

    const filteredDiscounts = useMemo(() => {
        return discounts.filter(d => d.code.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [discounts, searchTerm]);


    const renderDiscountForm = (
        data: Omit<Discount, 'id'> | Discount,
        submitHandler: (e: React.FormEvent) => void,
        submitText: string
    ) => (
        <form onSubmit={submitHandler} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                    type="text"
                    name="code"
                    placeholder="KODE KUPON"
                    value={data.code}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                />
                <select
                    name="type"
                    value={data.type}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Potongan Tetap (Rp)</option>
                </select>
                <input
                    type="number"
                    name="value"
                    placeholder="Nilai (e.g., 10 atau 15000)"
                    value={data.value}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                />
                 <input
                    type="number"
                    name="minPurchase"
                    placeholder="Min. Pembelian (Rp)"
                    value={data.minPurchase}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                />
            </div>
            <div className="flex justify-between items-center pt-2">
                 <div className="flex items-center gap-2">
                     <input type="checkbox" name="isActive" id="isActive" checked={data.isActive} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                     <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Aktifkan Diskon</label>
                 </div>
                <div className="flex gap-2">
                    <Tooltip text="Batalkan dan tutup form">
                        <button type="button" onClick={() => { setIsAdding(false); setEditingDiscount(null); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">Batal</button>
                    </Tooltip>
                    <Tooltip text="Simpan perubahan">
                        <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center">
                            <SaveIcon className="h-5 w-5 mr-2" /> {submitText}
                        </button>
                    </Tooltip>
                </div>
            </div>
        </form>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Kelola Diskon</h2>
                 {!isAdding && !editingDiscount && (
                    <Tooltip text="Buat kupon diskon baru">
                        <button onClick={() => { setIsAdding(true); setEditingDiscount(null); setFormState(initialFormState); }} className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2" /> Buat Diskon Baru
                        </button>
                    </Tooltip>
                )}
            </div>

            {isAdding && renderDiscountForm(formState, handleSubmit, "Simpan Diskon")}
            {editingDiscount && renderDiscountForm(editingDiscount, handleUpdateSubmit, "Update Diskon")}

             <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                    type="text"
                    placeholder="Cari berdasarkan kode diskon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    aria-label="Cari Diskon"
                />
            </div>

            <div className="bg-transparent md:bg-white md:dark:bg-gray-800 md:shadow-lg md:rounded-lg overflow-x-auto">
                <table className="w-full text-left">
                     <thead className="bg-gray-100 dark:bg-gray-700 hidden md:table-header-group">
                        <tr>
                            <th className="p-4">Kode Kupon</th>
                            <th className="p-4">Tipe</th>
                            <th className="p-4">Nilai</th>
                            <th className="p-4">Min. Pembelian</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="block md:table-row-group">
                        {filteredDiscounts.map(discount => (
                            <tr key={discount.id} className="block md:table-row border-b dark:border-gray-700 md:border-b transition-colors mb-4 md:mb-0 rounded-lg md:rounded-none shadow-md md:shadow-none bg-white dark:bg-gray-800">
                                <td className="p-3 md:p-4 block md:table-cell font-medium">
                                    <div className="flex items-center gap-3">
                                        <TicketIcon className="h-6 w-6 text-cyan-500" />
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{discount.code}</span>
                                    </div>
                                </td>
                                <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                    <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Tipe</span>
                                    <span className="capitalize">{discount.type}</span>
                                </td>
                                <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                     <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Nilai</span>
                                    <span className="font-semibold">{discount.type === 'percentage' ? `${discount.value}%` : `Rp ${discount.value.toLocaleString('id-ID')}`}</span>
                                </td>
                                <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                    <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Min. Pembelian</span>
                                    <span>{discount.minPurchase > 0 ? `Rp ${discount.minPurchase.toLocaleString('id-ID')}` : '-'}</span>
                                </td>
                                 <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                    <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Status</span>
                                     <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={discount.isActive} onChange={() => handleToggleActive(discount)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-cyan-600"></div>
                                    </label>
                                </td>
                                <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                    <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Aksi</span>
                                    <div className="flex gap-2 justify-end md:justify-start">
                                         <Tooltip text="Ubah diskon">
                                            <button onClick={() => startEditing(discount)} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md">Edit</button>
                                        </Tooltip>
                                        <Tooltip text="Hapus diskon">
                                            <button onClick={() => onDeleteDiscount(discount.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredDiscounts.length === 0 && (
                    <p className="text-center p-6 text-gray-500 dark:text-gray-400">
                        {discounts.length > 0 ? "Tidak ada diskon yang cocok." : "Belum ada diskon yang dibuat."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ManageDiscounts;
