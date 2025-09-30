import React, { useMemo } from 'react';
import { Item } from '../types';
import { XIcon, HeartIcon, ShoppingCartIcon } from './Icons';
import Tooltip from './Tooltip';

interface WishlistItemDetails extends Item {}

interface WishlistProps {
    isOpen: boolean;
    onClose: () => void;
    wishlist: number[];
    items: Item[];
    onToggleWishlist: (itemId: number) => void;
    onAddToCart: (itemId: number) => void;
}

const Wishlist: React.FC<WishlistProps> = ({ isOpen, onClose, wishlist, items, onToggleWishlist, onAddToCart }) => {
    
    const wishlistedItems: WishlistItemDetails[] = useMemo(() => {
        return wishlist
            .map(itemId => items.find(item => item.id === itemId))
            .filter((item): item is WishlistItemDetails => item !== null);
    }, [wishlist, items]);

    const handleAddToCartAndRemove = (itemId: number) => {
        onAddToCart(itemId);
        onToggleWishlist(itemId); // Remove from wishlist after adding to cart
    };

    return (
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <HeartIcon className="h-6 w-6 text-red-500" />
                        Wishlist
                    </h2>
                    <Tooltip text="Tutup">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </Tooltip>
                </header>
                
                <div className="p-4 flex-grow overflow-y-auto">
                    {wishlistedItems.length > 0 ? (
                        <div className="space-y-4">
                            {wishlistedItems.map(item => (
                                <div key={item.id} className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <img src={item.icon || `https://via.placeholder.com/150/020617/FFFFFF?text=${item.groupName.charAt(0)}`} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-200" />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-cyan-500 font-bold">{item.price}</p>
                                        {item.currentStock > 0 ? (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Stok Tersedia</p>
                                        ) : (
                                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">Stok Habis</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button 
                                                onClick={() => handleAddToCartAndRemove(item.id)}
                                                disabled={item.currentStock <= 0}
                                                className="px-3 py-1 text-xs bg-cyan-500 text-white rounded-md flex items-center gap-1 hover:bg-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <ShoppingCartIcon className="h-4 w-4"/> Pindah ke Keranjang
                                            </button>
                                        </div>
                                    </div>
                                    <Tooltip text="Hapus dari Wishlist">
                                        <button onClick={() => onToggleWishlist(item.id)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                            <HeartIcon className="h-5 w-5 text-red-500 fill-current"/>
                                        </button>
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <HeartIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                            <p className="mt-4 text-gray-500">Wishlist Anda kosong.</p>
                            <p className="text-sm text-gray-400">Klik ikon hati pada produk untuk menyimpannya di sini.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wishlist;
