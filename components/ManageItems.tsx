import React, { useState, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Item, StockLevelStatus, AlertConfigType, FeedbackMessage } from '../types';
import { PlusIcon, SaveIcon, WarningIcon, SparklesIcon, BoxIcon, DocumentArrowUpIcon } from './Icons';
import Tooltip from './Tooltip';

interface ManageItemsProps {
    items: Item[];
    onAddItem: (itemData: Omit<Item, 'id'>) => void;
    onUpdateItem: (updatedItem: Item) => void;
    onDeleteItem: (itemId: number) => void;
    onBulkAddItems: (items: Omit<Item, 'id'>[]) => void;
    setFeedback: (feedback: FeedbackMessage | null) => void;
}

// Gemini API Key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to get the numeric threshold for an alert
const getAlertThreshold = (item: Item): number | null => {
    const config = item.alertConfig || { type: AlertConfigType.DEFAULT, value: 0 };
    switch (config.type) {
        case AlertConfigType.DISABLED:
            return null;
        case AlertConfigType.QUANTITY:
            return config.value;
        case AlertConfigType.PERCENTAGE:
            // Ensure calculation is safe if minStock is 0
            return item.minStock > 0 ? Math.floor(item.minStock * (config.value / 100)) : 0;
        case AlertConfigType.DEFAULT:
        default:
            return item.minStock;
    }
};

const getStockLevelStatus = (item: Item): StockLevelStatus => {
    const threshold = getAlertThreshold(item);
    
    if (item.currentStock <= 0) {
        return StockLevelStatus.CRITICAL;
    }
    // Use the custom threshold for LOW status, but fallback to minStock for WARNING
    if (threshold !== null && item.currentStock <= threshold) {
        return StockLevelStatus.LOW;
    }
    if (item.currentStock <= item.minStock * 1.25) {
        return StockLevelStatus.WARNING;
    }
    return StockLevelStatus.NORMAL;
};


const statusConfig: Record<StockLevelStatus, { label: string; badgeClasses: string; rowClasses: string; icon?: React.ReactNode }> = {
    [StockLevelStatus.CRITICAL]: {
        label: 'Kritis',
        badgeClasses: 'bg-red-600 text-white',
        rowClasses: 'bg-red-100 dark:bg-red-900/40 md:bg-red-100 md:dark:bg-red-900/40',
        icon: <WarningIcon className="h-5 w-5 inline mr-1 text-red-600" />
    },
    [StockLevelStatus.LOW]: {
        label: 'Rendah',
        badgeClasses: 'bg-orange-500 text-white',
        rowClasses: 'bg-orange-50 dark:bg-orange-500/20 md:bg-orange-50 md:dark:bg-orange-500/20',
        icon: <WarningIcon className="h-5 w-5 inline mr-1 text-orange-500" />
    },
    [StockLevelStatus.WARNING]: {
        label: 'Peringatan',
        badgeClasses: 'bg-yellow-500 text-white',
        rowClasses: 'bg-yellow-50 dark:bg-yellow-500/20 md:bg-yellow-50 md:dark:bg-yellow-500/20',
    },
    [StockLevelStatus.NORMAL]: {
        label: 'Normal',
        badgeClasses: 'bg-green-500 text-white',
        rowClasses: 'bg-white dark:bg-gray-800 md:hover:bg-gray-50 md:dark:hover:bg-gray-700/50',
    },
};

const statusSortOrder: Record<StockLevelStatus, number> = {
    [StockLevelStatus.CRITICAL]: 0,
    [StockLevelStatus.LOW]: 1,
    [StockLevelStatus.WARNING]: 2,
    [StockLevelStatus.NORMAL]: 3,
};


const ManageItems: React.FC<ManageItemsProps> = ({ items, onAddItem, onUpdateItem, onDeleteItem, onBulkAddItems, setFeedback }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialFormState: Omit<Item, 'id'> = {
        name: '',
        unit: 'Akun',
        minStock: 5,
        currentStock: 10,
        description: '',
        alertConfig: { type: AlertConfigType.DEFAULT, value: 0 },
        icon: '',
        category: 'Akun Streaming',
        groupName: '',
        planName: '',
        price: '',
        warranty: 'Garansi 1 Bulan',
        features: [],
        isVisibleInStore: true,
        orderLink: ''
    };
    const [formState, setFormState] = useState<Omit<Item, 'id'>>(initialFormState);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<StockLevelStatus | 'ALL'>('ALL');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);


    const handleFormChange = (
        setter: React.Dispatch<React.SetStateAction<any>>, 
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setter((prev: any) => ({ ...prev, [name]: checked }));
            return;
        }

        const isNumeric = ['minStock', 'currentStock'].includes(name);
        const processedValue = isNumeric ? parseInt(value, 10) || 0 : value;

        if (name === 'features') {
            setter((prev: any) => ({ ...prev, features: value.split('\n') }));
        } else {
            setter((prev: any) => ({ ...prev, [name]: processedValue }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFormChange(setFormState, e);
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFormChange(setEditingItem, e);


    const handleAlertConfigChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const currentData = editingItem || formState;
        const newConfig = { 
            ...currentData.alertConfig, 
            [name]: name === 'value' ? parseInt(value, 10) || 0 : value 
        };

        if (editingItem) {
            setEditingItem({ ...editingItem, alertConfig: newConfig });
        } else {
            setFormState({ ...formState, alertConfig: newConfig });
        }
    };

    const handleGenerateIcon = async () => {
        const currentData = editingItem || formState;
        if (!currentData.name.trim()) {
            alert('Silakan masukkan nama item terlebih dahulu.');
            return;
        }
    
        setIsGenerating(true);
        try {
            const prompt = `Ikon sederhana, modern, datar, minimalis untuk langganan produk digital bernama "${currentData.name}". Ikon harus dalam gaya vektor dengan latar belakang putih bersih, cocok untuk antarmuka pengguna. Tanpa teks.`;
    
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });
    
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
    
            if (editingItem) {
                setEditingItem(prev => ({ ...prev!, icon: imageUrl }));
            } else {
                setFormState(prev => ({ ...prev, icon: imageUrl }));
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            alert('Gagal membuat ikon. Silakan coba lagi.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem(formState);
        setFormState(initialFormState);
        setIsAdding(false);
    };
    
    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            onUpdateItem(editingItem);
            setEditingItem(null);
        }
    };

    const startEditing = (item: Item) => {
        setEditingItem({ ...item });
        setIsAdding(false);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                parseAndImportCSV(text);
            }
        };
        reader.readAsText(file);
        // Reset file input to allow re-uploading the same file
        event.target.value = '';
    };

    const parseAndImportCSV = (csvText: string) => {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) {
            setFeedback({ message: 'File CSV kosong atau hanya berisi header.', type: 'error' });
            return;
        }
    
        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['name', 'category', 'groupName', 'planName', 'price'];
        for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
                setFeedback({ message: `Header CSV yang wajib ada '${required}' tidak ditemukan.`, type: 'error' });
                return;
            }
        }
    
        const newItems: Omit<Item, 'id'>[] = [];
        let errorCount = 0;
    
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
    
            const values = (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(v => v.trim().replace(/^"|"$/g, ''));
    
            const rowObject = headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
            }, {} as Record<string, string>);
    
            if (!rowObject.name || !rowObject.category || !rowObject.groupName || !rowObject.planName || !rowObject.price) {
                errorCount++;
                continue;
            }
    
            const newItem: Omit<Item, 'id'> = {
                name: rowObject.name,
                unit: rowObject.unit || 'Unit',
                minStock: parseInt(rowObject.minStock, 10) || 0,
                currentStock: parseInt(rowObject.currentStock, 10) || 0,
                description: rowObject.description || '',
                alertConfig: { type: AlertConfigType.DEFAULT, value: 0 },
                icon: '',
                category: rowObject.category,
                groupName: rowObject.groupName,
                planName: rowObject.planName,
                price: rowObject.price,
                warranty: rowObject.warranty || 'Garansi 1 Bulan',
                features: rowObject.features ? rowObject.features.split(';').map(f => f.trim()) : [],
                isVisibleInStore: !['false', '0', 'no'].includes(rowObject.isVisibleInStore?.toLowerCase()),
                orderLink: rowObject.orderLink || '',
                testimonials: [],
            };
    
            newItems.push(newItem);
        }
    
        if (newItems.length > 0) {
            onBulkAddItems(newItems);
        }
    
        let message = '';
        if (newItems.length > 0) {
            message += `${newItems.length} item berhasil diimpor. `;
        }
        if (errorCount > 0) {
            message += `${errorCount} baris diabaikan karena data tidak lengkap.`;
        }
    
        if (message) {
            setFeedback({ message, type: newItems.length > 0 ? 'success' : 'error' });
        }
    };

    const processedItems = useMemo(() => {
        let processed = items
            .map(item => ({ ...item, status: getStockLevelStatus(item) }))
            .filter(item => {
                const term = searchTerm.toLowerCase();
                return (
                    item.name.toLowerCase().includes(term) ||
                    item.category.toLowerCase().includes(term) ||
                    item.description.toLowerCase().includes(term)
                );
            });

        if (activeFilter !== 'ALL') {
            processed = processed.filter(item => item.status === activeFilter);
        }

        if (sortDirection) {
            processed.sort((a, b) => {
                const orderA = statusSortOrder[a.status];
                const orderB = statusSortOrder[b.status];
                return sortDirection === 'asc' ? orderA - orderB : orderB - orderA;
            });
        }

        return processed;
    }, [items, searchTerm, activeFilter, sortDirection]);

    const handleSort = () => {
        if (sortDirection === 'asc') {
            setSortDirection('desc');
        } else if (sortDirection === 'desc') {
            setSortDirection(null);
        } else {
            setSortDirection('asc');
        }
    };

    const renderItemForm = (
        itemState: Omit<Item, 'id'> | Item, 
        changeHandler: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, 
        alertChangeHandler: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void,
        submitHandler: (e: React.FormEvent) => void, 
        submitText: string
    ) => (
        <form onSubmit={submitHandler} className="mt-4 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow space-y-6">
            {/* --- Basic Info --- */}
            <fieldset className="border-t pt-4 dark:border-gray-600">
                <legend className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Informasi Dasar & Stok</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input type="text" name="name" placeholder="Nama Item Unik (e.g. Netflix - Sharing)" value={itemState.name} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                    <input type="text" name="unit" placeholder="Unit (e.g., Akun, Lisensi)" value={itemState.unit} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                    <input type="number" name="currentStock" placeholder="Stok Saat Ini" value={itemState.currentStock} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" min="0" />
                    <input type="number" name="minStock" placeholder="Stok Minimum" value={itemState.minStock} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" min="0" />
                </div>
            </fieldset>
            
            {/* --- Catalog Info --- */}
            <fieldset className="border-t pt-4 dark:border-gray-600">
                 <legend className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Detail Tampilan Toko</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <input type="text" name="category" placeholder="Kategori (e.g. Akun Streaming)" value={itemState.category} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                     <input type="text" name="groupName" placeholder="Grup Produk (e.g. Netflix)" value={itemState.groupName} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                     <input type="text" name="planName" placeholder="Nama Paket (e.g. Sharing)" value={itemState.planName} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                     <input type="text" name="price" placeholder="Harga (e.g. 30k)" value={itemState.price} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                     <input type="text" name="warranty" placeholder="Garansi (e.g. Garansi 1 Bulan)" value={itemState.warranty} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                     <input type="text" name="orderLink" placeholder="Link Order WhatsApp Grup" value={itemState.orderLink} onChange={changeHandler} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                 </div>
                 <textarea name="description" placeholder="Deskripsi untuk paket ini" value={itemState.description} onChange={changeHandler} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 mt-4" />
                 <textarea name="features" placeholder="Fitur (satu per baris)" value={Array.isArray(itemState.features) ? itemState.features.join('\n') : ''} onChange={changeHandler} rows={4} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 mt-4" />
                 <div className="flex items-center gap-2 mt-4">
                     <input type="checkbox" name="isVisibleInStore" id="isVisibleInStore" checked={itemState.isVisibleInStore} onChange={changeHandler} className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                     <label htmlFor="isVisibleInStore" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan di Toko</label>
                 </div>
            </fieldset>

            {/* --- Icon Generator --- */}
             <fieldset className="border-t pt-4 dark:border-gray-600">
                 <legend className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Ikon Item</legend>
                 <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border dark:border-gray-600 flex-shrink-0">
                        {itemState.icon ? (
                            <img src={itemState.icon} alt="Generated Icon" className="w-full h-full object-cover" />
                        ) : (
                             <BoxIcon className="h-10 w-10 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm text-gray-500 mb-2">Buat ikon unik untuk item Anda menggunakan AI berdasarkan nama item.</p>
                        <Tooltip text="Buat ikon berdasarkan Nama Item">
                            <button
                                type="button"
                                onClick={handleGenerateIcon}
                                disabled={isGenerating || !itemState.name.trim()}
                                className="px-4 py-2 text-sm bg-cyan-500 text-white rounded-lg flex items-center gap-2 hover:bg-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                <SparklesIcon className="h-4 w-4" />
                                {isGenerating ? 'Membuat...' : 'Buat Ikon AI'}
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </fieldset>

            {/* --- Alert Config --- */}
            <fieldset className="border-t pt-4 dark:border-gray-600">
                 <legend className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Pengaturan Notifikasi Stok Rendah</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="text-sm text-gray-600 dark:text-gray-400">Tipe Notifikasi</label>
                         <select name="type" value={itemState.alertConfig.type} onChange={handleAlertConfigChange} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600">
                             <option value={AlertConfigType.DEFAULT}>Default (Stok Minimum)</option>
                             <option value={AlertConfigType.QUANTITY}>Jumlah Spesifik</option>
                             <option value={AlertConfigType.PERCENTAGE}>Persentase Stok Min.</option>
                             <option value={AlertConfigType.DISABLED}>Nonaktifkan</option>
                         </select>
                     </div>
                     {(itemState.alertConfig.type === AlertConfigType.QUANTITY || itemState.alertConfig.type === AlertConfigType.PERCENTAGE) && (
                         <div>
                             <label className="text-sm text-gray-600 dark:text-gray-400">
                                {itemState.alertConfig.type === AlertConfigType.QUANTITY ? 'Batas Jumlah (unit)' : 'Batas Persentase (%)'}
                             </label>
                             <input type="number" name="value" value={itemState.alertConfig.value} onChange={handleAlertConfigChange} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" min="0" />
                         </div>
                     )}
                 </div>
            </fieldset>

            <div className="flex justify-end gap-2 pt-4">
                <Tooltip text="Batalkan dan tutup form">
                    <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">Batal</button>
                </Tooltip>
                <Tooltip text="Simpan perubahan">
                    <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center">
                        <SaveIcon className="h-5 w-5 mr-2" /> {submitText}
                    </button>
                </Tooltip>
            </div>
        </form>
    );

    const getAlertTooltipText = (item: Item): string => {
        const threshold = getAlertThreshold(item);
        const config = item.alertConfig;
        switch (config.type) {
            case AlertConfigType.DISABLED: return "Notifikasi dinonaktifkan untuk item ini.";
            case AlertConfigType.QUANTITY: return `Notifikasi aktif saat stok ≤ ${threshold} unit.`;
            case AlertConfigType.PERCENTAGE: return `Notifikasi aktif saat stok ≤ ${config.value}% dari min. stok (≤ ${threshold} unit).`;
            default: return `Notifikasi aktif saat stok ≤ stok minimum (${threshold} unit).`;
        }
    };

    const csvTemplateHeaders = 'name,unit,minStock,currentStock,description,category,groupName,planName,price,warranty,features,isVisibleInStore,orderLink';
    const csvTemplateData = '"Netflix - Private","Akun",5,10,"Akun private, kualitas 4K UHD+HDR","Akun Streaming","Netflix","Private","120k","Garansi 1 Bulan","Private account;Kualitas 4K UHD+HDR",TRUE,https://wa.me/yournumber';
    const csvTemplate = `${csvTemplateHeaders}\n${csvTemplateData}`;
    const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplate)}`;


    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Kelola Item</h2>
                {!isAdding && !editingItem && (
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv"
                            className="hidden"
                        />
                        <Tooltip text="Impor item secara massal dari file CSV">
                            <button onClick={handleImportClick} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center">
                                <DocumentArrowUpIcon className="h-5 w-5 mr-2" /> Import
                            </button>
                        </Tooltip>
                        <Tooltip text="Buka form untuk menambah item baru">
                            <button onClick={() => { setIsAdding(true); setEditingItem(null); setFormState(initialFormState); }} className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center">
                                <PlusIcon className="h-5 w-5 mr-2" /> Tambah Item
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>

            {isAdding && renderItemForm(formState, handleInputChange, handleAlertConfigChange, handleSubmit, "Simpan Item")}
            {editingItem && renderItemForm(editingItem, handleEditInputChange, handleAlertConfigChange, handleUpdateSubmit, "Update Item")}

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Cari item berdasarkan nama, kategori, atau deskripsi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                        aria-label="Cari Item"
                    />
                     <div>
                        <label htmlFor="status-filter" className="sr-only">Filter Berdasarkan Status</label>
                        <select
                            id="status-filter"
                            value={activeFilter}
                            onChange={(e) => setActiveFilter(e.target.value as StockLevelStatus | 'ALL')}
                            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                            aria-label="Filter Berdasarkan Status"
                        >
                            <option value="ALL">Semua Status</option>
                            {Object.keys(statusConfig).map(status => (
                                <option key={status} value={status}>
                                    {statusConfig[status as StockLevelStatus].label}
                                </option>
                            ))}
                        </select>
                     </div>
                </div>
                <div className="text-right mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Butuh impor massal?
                        <a href={csvDataUri} download="template_import_item.csv" className="text-cyan-600 hover:underline ml-1 font-semibold">
                            Download template CSV
                        </a>
                    </p>
                </div>
            </div>

            <div className="bg-transparent md:bg-white md:dark:bg-gray-800 md:shadow-lg md:rounded-lg overflow-x-auto mt-6">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700 hidden md:table-header-group">
                        <tr>
                            <th className="p-4">Item</th>
                            <th className="p-4">Stok</th>
                            <th className="p-4">Kategori</th>
                            <th className="p-4" onClick={handleSort} style={{ cursor: 'pointer' }}>
                                Status {sortDirection === 'asc' ? '▲' : sortDirection === 'desc' ? '▼' : ''}
                            </th>
                            <th className="p-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="block md:table-row-group">
                        {processedItems.map(item => {
                            const status = statusConfig[item.status];
                            return (
                                <tr key={item.id} className={`block md:table-row border-b dark:border-gray-700 md:border-b last:border-b-0 mb-4 md:mb-0 p-4 md:p-0 rounded-lg md:rounded-none shadow-md md:shadow-none ${status.rowClasses}`}>
                                    <td className="p-3 md:p-4 block md:table-cell font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {item.icon ? (
                                                    <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <BoxIcon className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.unit}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                        <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Stok</span>
                                        <div>
                                            <p className="font-bold text-lg">{item.currentStock}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Min: {item.minStock}</p>
                                        </div>
                                    </td>
                                    <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                        <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Kategori</span>
                                        <span className="text-gray-600 dark:text-gray-300">{item.category}</span>
                                    </td>
                                    <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                        <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Status</span>
                                        <Tooltip text={getAlertTooltipText(item)}>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.badgeClasses}`}>
                                                {status.label}
                                            </span>
                                        </Tooltip>
                                    </td>
                                    <td className="p-3 md:p-4 flex justify-between items-center md:table-cell border-t md:border-t-0 dark:border-gray-700">
                                        <span className="font-normal text-gray-500 dark:text-gray-400 md:hidden">Aksi</span>
                                        <div className="flex gap-2 justify-end md:justify-start">
                                            <Tooltip text="Ubah detail item">
                                                <button onClick={() => startEditing(item)} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md">Edit</button>
                                            </Tooltip>
                                            <Tooltip text="Hapus item">
                                                <button onClick={() => onDeleteItem(item.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md">Hapus</button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {processedItems.length === 0 && (
                    <p className="text-center p-6 text-gray-500 dark:text-gray-400">
                        {items.length > 0 ? "Tidak ada item yang cocok dengan filter Anda." : "Belum ada item yang ditambahkan."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ManageItems;