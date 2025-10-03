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

const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

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
    const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);


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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleFormChange(setFormState, e);
        if (e.target.name === 'category' && suggestedCategories.length > 0) {
            setSuggestedCategories([]);
        }
    };
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleFormChange(setEditingItem, e);
         if (e.target.name === 'category' && suggestedCategories.length > 0) {
            setSuggestedCategories([]);
        }
    };


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

    const handleSuggestCategory = async () => {
        const currentData = editingItem || formState;
        if (!currentData.name.trim()) {
            setFeedback({ message: 'Masukkan nama item terlebih dahulu untuk mendapatkan saran.', type: 'error' });
            return;
        }
        setIsSuggesting(true);
        setSuggestedCategories([]);

        const prompt = `
            You are an e-commerce categorization expert for a digital goods store.
            Based on the following product information, suggest 3 to 5 relevant and concise category tags.
            The categories should be in Bahasa Indonesia.
            Return ONLY a comma-separated list of the suggested categories (e.g., Streaming, Hiburan, Akun Premium).

            Product Name: ${currentData.name}
            Description: ${currentData.description}
            Features: ${Array.isArray(currentData.features) ? currentData.features.join(', ') : ''}
        `.trim();

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const suggestions = response.text.split(',').map(s => s.trim()).filter(Boolean);
            setSuggestedCategories(suggestions);
        } catch (error) {
            console.error("Gemini category suggestion error:", error);
            setFeedback({ message: 'Gagal mendapatkan saran kategori.', type: 'error' });
        } finally {
            setIsSuggesting(false);
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
        setSuggestedCategories([]);
    };
    
    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            onUpdateItem(editingItem);
            setEditingItem(null);
            setSuggestedCategories([]);
        }
    };

    const startEditing = (item: Item) => {
        setEditingItem({ ...item });
        setIsAdding(false);
        setSuggestedCategories([]);
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
                    <div>
                         <div className="relative">
                            <input type="text" name="category" placeholder="Kategori (e.g. Akun Streaming)" value={itemState.category} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                            <Tooltip text="Dapatkan Saran Kategori dari AI">
                                <button
                                    type="button"
                                    onClick={handleSuggestCategory}
                                    disabled={isSuggesting || !itemState.name.trim()}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-cyan-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isSuggesting ? <SpinnerIcon className="h-5 w-5" /> : <SparklesIcon className="h-5 w-5" />}
                                </button>
                            </Tooltip>
                         </div>
                         {suggestedCategories.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {suggestedCategories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            if (editingItem) {
                                                setEditingItem(prev => ({ ...prev!, category: cat }));
                                            } else {
                                                setFormState(prev => ({ ...prev, category: cat }));
                                            }
                                            setSuggestedCategories([]);
                                        }}
                                        className="px-3 py-1 text-sm bg-cyan-100 text-cyan-800 rounded-full hover:bg-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-200 dark:hover:bg-cyan-900"
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                     <input type="text" name="groupName" placeholder="Grup Produk (e.g. Netflix)" value={itemState.groupName} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                     <input type="text" name="planName" placeholder="Nama Paket (e.g. Sharing)" value={itemState.planName} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                     <input type="text" name="price" placeholder="Harga (e.g. 30k)" value={itemState.price} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                     <input type="text" name="warranty" placeholder="Garansi (e.g. Garansi 1 Bulan)" value={itemState.warranty} onChange={changeHandler} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                     <input type="text" name="orderLink" placeholder="Link Pesan (Opsional)" value={itemState.orderLink || ''} onChange={changeHandler} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                 </div>
                 <div className="mt-4">
                     <textarea name="description" placeholder="Deskripsi singkat produk..." value={itemState.description} onChange={changeHandler} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" rows={2}></textarea>
                 </div>
                  <div className="mt-4">
                     <textarea name="features" placeholder="Fitur (satu per baris)..." value={Array.isArray(itemState.features) ? itemState.features.join('\n') : ''} onChange={changeHandler} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" rows={3}></textarea>
                 </div>
                 <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="isVisibleInStore" id="isVisibleInStore" checked={itemState.isVisibleInStore} onChange={changeHandler} className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                        <label htmlFor="isVisibleInStore" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan di Toko</label>
                    </div>
                     <div className="relative w-48 h-24 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center">
                        {itemState.icon ? <img src={itemState.icon} alt="Item icon" className="w-full h-full object-contain rounded" /> : <span className="text-xs text-gray-500">Ikon</span>}
                    </div>
                    <Tooltip text="Buat Ikon Otomatis dengan AI">
                        <button
                            type="button"
                            onClick={handleGenerateIcon}
                            disabled={isGenerating || !itemState.name.trim()}
                            className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg flex items-center gap-2 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <SparklesIcon className="h-4 w-4" />
                            {isGenerating ? 'Membuat...' : 'Buat Ikon'}
                        </button>
                    </Tooltip>
                 </div>
            </fieldset>

            {/* --- Alert Config --- */}
            <fieldset className="border-t pt-4 dark:border-gray-600">
                 <legend className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Konfigurasi Notifikasi Stok</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <select name="type" value={itemState.alertConfig.type} onChange={alertChangeHandler} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600">
                        <option value={AlertConfigType.DEFAULT}>Gunakan Stok Minimum</option>
                        <option value={AlertConfigType.QUANTITY}>Jumlah Spesifik</option>
                        <option value={AlertConfigType.PERCENTAGE}>Persentase dari Stok Minimum</option>
                        <option value={AlertConfigType.DISABLED}>Nonaktifkan Notifikasi</option>
                     </select>
                     {(itemState.alertConfig.type === AlertConfigType.QUANTITY || itemState.alertConfig.type === AlertConfigType.PERCENTAGE) && (
                         <input
                            type="number"
                            name="value"
                            placeholder="Nilai"
                            value={itemState.alertConfig.value}
                            onChange={alertChangeHandler}
                            min="0"
                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                        />
                     )}
                 </div>
            </fieldset>
            
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); setSuggestedCategories([]); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center">
                    <SaveIcon className="h-5 w-5 mr-2" /> {submitText}
                </button>
            </div>
        </form>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center"><BoxIcon className="h-8 w-8 mr-3"/> Kelola Item</h2>
                <div className="flex gap-2">
                    <Tooltip text="Impor item dari file CSV">
                         <button onClick={handleImportClick} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center">
                            <DocumentArrowUpIcon className="h-5 w-5 mr-2" /> Impor CSV
                        </button>
                    </Tooltip>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                    {!isAdding && !editingItem && (
                        <Tooltip text="Buka form untuk menambah item baru">
                            <button onClick={() => { setIsAdding(true); setEditingItem(null); setFormState(initialFormState); setSuggestedCategories([]); }} className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center">
                                <PlusIcon className="h-5 w-5 mr-2" /> Tambah Item
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>

            {isAdding && renderItemForm(formState, handleInputChange, handleAlertConfigChange, handleSubmit, "Simpan Item")}
            {editingItem && renderItemForm(editingItem, handleEditInputChange, handleAlertConfigChange, handleUpdateSubmit, "Update Item")}

            {/* Table Section */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="p-4 flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Cari item..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                        aria-label="Search items"
                    />
                    <div className="flex gap-2">
                         <select
                            value={activeFilter}
                            onChange={e => setActiveFilter(e.target.value as any)}
                            className="w-full md:w-auto p-2 border rounded dark:bg-gray-900 dark:border-gray-600"
                            aria-label="Filter by stock status"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value={StockLevelStatus.NORMAL}>Normal</option>
                            <option value={StockLevelStatus.WARNING}>Peringatan</option>
                            <option value={StockLevelStatus.LOW}>Rendah</option>
                            <option value={StockLevelStatus.CRITICAL}>Kritis</option>
                        </select>
                         <button onClick={handleSort} className="w-full md:w-auto p-2 border rounded dark:bg-gray-900 dark:border-gray-600">
                           {sortDirection === 'asc' ? 'Sort ↓' : sortDirection === 'desc' ? 'Sort ↑' : 'Sort Status'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                         <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-4">Nama Item</th>
                                <th className="p-4">Stok Saat Ini</th>
                                <th className="p-4">Stok Minimum</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedItems.map(item => {
                                const statusInfo = statusConfig[item.status];
                                const threshold = getAlertThreshold(item);
                                return (
                                <tr key={item.id} className={`${statusInfo.rowClasses} transition-colors`}>
                                    <td className="p-4 font-medium">{item.name}</td>
                                    <td className="p-4">{item.currentStock}</td>
                                    <td className="p-4">{threshold ?? 'N/A'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.badgeClasses}`}>
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                    <td className="p-4">{item.category}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => startEditing(item)} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md">Edit</button>
                                            <button onClick={() => onDeleteItem(item.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md">Hapus</button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                 {processedItems.length === 0 && (
                    <p className="p-6 text-center text-gray-500 dark:text-gray-400">
                        {items.length > 0 ? "Tidak ada item yang cocok dengan filter Anda." : "Belum ada item yang ditambahkan."}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ManageItems;