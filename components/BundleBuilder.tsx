import React, { useState, useMemo } from 'react';
import { Item } from '../types';
import { XIcon, PlusIcon, PuzzlePieceIcon, CheckmarkIcon, ShoppingCartIcon } from './Icons';
import {
    NetflixIcon, YoutubeIcon, SpotifyIcon, DisneyPlusIcon,
    CapcutIcon, CanvaIcon, ChatGPTIcon, GameControllerIcon, BriefcaseIcon, SparklesIcon
} from './Icons';

interface BundleBuilderProps {
    items: Item[];
    onClose: () => void;
    onAddBundleToCart: (bundleItems: Item[], discountAmount: number) => void;
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

const categoryInfo: Record<string, { icon: React.FC<any> }> = {
    'Akun Streaming': { icon: DisneyPlusIcon },
    'Lisensi Produktivitas': { icon: BriefcaseIcon },
    'Voucher Game': { icon: GameControllerIcon },
    'Lain-lain': { icon: SparklesIcon },
};

const productIconMap: Record<string, React.FC<any>> = {
    'Disney+ Hotstar': DisneyPlusIcon, 'Netflix': NetflixIcon, 'CapCut Pro': CapcutIcon,
    'Canva Pro': CanvaIcon, 'ChatGPT Plus': ChatGPTIcon, 'YouTube Premium': YoutubeIcon,
    'Spotify Premium': SpotifyIcon, 'Mobile Legends': GameControllerIcon,
};

const BUNDLE_DISCOUNT_TIERS: { [key: number]: number } = {
    2: 5, 3: 10, 4: 15,
};

const BundleBuilder: React.FC<BundleBuilderProps> = ({ items, onClose, onAddBundleToCart }) => {
    const [bundleItems, setBundleItems] = useState<Item[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const productGroups = useMemo(() => {
        const uniqueGroups: { [key: string]: Item } = {};
        items.forEach(item => {
            // We select the cheapest plan as the representative for the group in the builder
            if (item.isVisibleInStore && item.currentStock > 0) {
                if (!uniqueGroups[item.groupName] || parsePrice(item.price) < parsePrice(uniqueGroups[item.groupName].price)) {
                    uniqueGroups[item.groupName] = item;
                }
            }
        });
        return Object.values(uniqueGroups);
    }, [items]);

    const filteredItems = useMemo(() => {
        return productGroups.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const matchesSearch = item.groupName.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [productGroups, activeCategory, searchTerm]);

    const categories = useMemo(() => {
        const uniqueCategories = new Set(productGroups.map(item => item.category));
        return ['All', ...Array.from(uniqueCategories)];
    }, [productGroups]);

    const handleToggleItem = (item: Item) => {
        setBundleItems(prev =>
            prev.find(bi => bi.groupName === item.groupName)
                ? prev.filter(bi => bi.groupName !== item.groupName)
                : [...prev, item]
        );
    };

    const { subtotal, discountPercent, discountAmount, totalPrice } = useMemo(() => {
        const sub = bundleItems.reduce((total, item) => total + parsePrice(item.price), 0);
        const uniqueGroupCount = new Set(bundleItems.map(i => i.groupName)).size;
        
        let percent = 0;
        if (uniqueGroupCount >= 4) percent = BUNDLE_DISCOUNT_TIERS[4];
        else if (uniqueGroupCount >= 2) percent = BUNDLE_DISCOUNT_TIERS[uniqueGroupCount] || 0;

        const discount = Math.floor(sub * (percent / 100));
        const total = sub - discount;
        return { subtotal: sub, discountPercent: percent, discountAmount: discount, totalPrice: total };
    }, [bundleItems]);
    
    const handleAddClick = () => {
        if (bundleItems.length > 0) {
            onAddBundleToCart(bundleItems, discountAmount);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <PuzzlePieceIcon className="h-6 w-6 text-cyan-500" /> FUTO Paket Builder
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><XIcon className="h-6 w-6" /></button>
                </header>

                <div className="flex flex-col md:flex-row flex-grow min-h-0">
                    {/* Left Panel: Product Selection */}
                    <div className="w-full md:w-3/5 border-r dark:border-gray-700 flex flex-col">
                        <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600"
                            />
                            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors flex-shrink-0 ${activeCategory === cat ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map(item => {
                                const ProductIcon = productIconMap[item.groupName] || categoryInfo[item.category]?.icon || SparklesIcon;
                                const isSelected = bundleItems.some(bi => bi.groupName === item.groupName);
                                return (
                                    <button
                                        key={item.groupName}
                                        onClick={() => handleToggleItem(item)}
                                        className={`p-4 border rounded-lg text-center transition-all duration-200 relative ${isSelected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-2 ring-cyan-500' : 'bg-gray-50 dark:bg-gray-900/50 hover:border-gray-400 dark:hover:border-gray-500'}`}
                                    >
                                        {isSelected && <div className="absolute top-2 right-2 bg-cyan-500 text-white rounded-full p-0.5"><CheckmarkIcon className="h-3 w-3" /></div>}
                                        <ProductIcon className="h-10 w-10 mx-auto mb-2 text-cyan-500" />
                                        <p className="font-semibold text-sm truncate">{item.groupName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">mulai dari {item.price}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Panel: Bundle Summary */}
                    <div className="w-full md:w-2/5 flex flex-col bg-gray-50 dark:bg-gray-800/50">
                        <div className="p-6 flex-grow overflow-y-auto">
                            <h3 className="font-bold text-lg mb-4">Paket Anda</h3>
                            {bundleItems.length > 0 ? (
                                <div className="space-y-3">
                                    {bundleItems.map(item => (
                                        <div key={item.groupName} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                                            <div>
                                                <p className="font-semibold">{item.groupName}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.planName}</p>
                                            </div>
                                            <p className="font-bold text-cyan-500">{item.price}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <PuzzlePieceIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <p className="text-gray-500">Pilih item dari kiri untuk memulai.</p>
                                    <p className="text-xs text-gray-400 mt-1">Diskon 5-15% menanti!</p>
                                </div>
                            )}
                        </div>
                        <footer className="p-6 border-t dark:border-gray-700 flex-shrink-0 space-y-4">
                             <div className="space-y-2">
                                <div className="flex justify-between text-md"><span className="text-gray-600 dark:text-gray-300">Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
                                {discountPercent > 0 && <div className="flex justify-between text-md text-green-600 dark:text-green-400"><span>Diskon Paket ({discountPercent}%)</span><span>- Rp {discountAmount.toLocaleString('id-ID')}</span></div>}
                                <div className="flex justify-between text-xl font-bold pt-2 border-t dark:border-gray-600"><span>Total</span><span>Rp {totalPrice.toLocaleString('id-ID')}</span></div>
                            </div>
                            <button
                                onClick={handleAddClick}
                                disabled={bundleItems.length < 2}
                                className="w-full bg-cyan-500 text-white font-bold py-3 rounded-lg hover:bg-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <ShoppingCartIcon className="h-5 w-5" />
                                Tambahkan {bundleItems.length > 0 ? `${bundleItems.length} Item ` : ''} ke Keranjang
                            </button>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BundleBuilder;