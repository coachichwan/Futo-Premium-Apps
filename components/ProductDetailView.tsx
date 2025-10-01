import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Item } from '../types';
import { XIcon, CheckmarkIcon, ShoppingCartIcon, ArrowRightIcon, QuoteIcon, SparklesIcon, HeartIcon } from './Icons';

// Gemini API Key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


interface ProductDetailViewProps {
    item: Item;
    onClose: () => void;
    onAddToCart: (itemId: number) => void;
    onQuickBuy: (item: Item) => void;
    wishlist: number[];
    onToggleWishlist: (itemId: number) => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ item, onClose, onAddToCart, onQuickBuy, wishlist, onToggleWishlist }) => {
    const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
    const [featureDescription, setFeatureDescription] = useState<string>('');
    const [isLoadingDescription, setIsLoadingDescription] = useState(false);

    const isOutOfStock = item.currentStock <= 0;
    const isLowStock = !isOutOfStock && item.currentStock <= item.minStock;
    const isWishlisted = wishlist.includes(item.id);

    const handleFeatureClick = async (feature: string) => {
        setSelectedFeature(feature);
        setIsLoadingDescription(true);
        setFeatureDescription(''); // Clear previous description

        try {
            const prompt = `Jelaskan secara singkat (1-2 kalimat) dan sederhana apa arti dari fitur produk berikut untuk pelanggan: "${feature}". Fokus pada manfaat utamanya.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setFeatureDescription(response.text);
        } catch (error) {
            console.error("Error generating feature description:", error);
            setFeatureDescription('Tidak dapat memuat penjelasan. Silakan coba lagi.');
        } finally {
            setIsLoadingDescription(false);
        }
    };

    const closeFeatureModal = () => {
        setSelectedFeature(null);
        setFeatureDescription('');
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Feature Detail Modal */}
                {selectedFeature && (
                    <div 
                        className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 p-4" 
                        onClick={closeFeatureModal}
                    >
                        <div 
                            className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-6 w-full max-w-sm border dark:border-gray-700" 
                            onClick={e => e.stopPropagation()}
                        >
                            <h4 className="font-bold text-lg text-cyan-500">{selectedFeature}</h4>
                            <div className="mt-4 min-h-[60px] flex items-center">
                                {isLoadingDescription ? (
                                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                        <Spinner />
                                        <span>Memuat penjelasan dari AI...</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-700 dark:text-gray-300">{featureDescription}</p>
                                )}
                            </div>
                            <button 
                                onClick={closeFeatureModal} 
                                className="mt-4 w-full bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition-colors"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                )}


                {/* Header */}
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                             {item.icon ? (
                                <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
                             ) : (
                                <span className="font-bold text-xl text-gray-500">{item.groupName.charAt(0)}</span>
                             )}
                         </div>
                         <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.groupName}</p>
                         </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <XIcon className="h-6 w-6 text-gray-500" />
                    </button>
                </header>

                {/* Body */}
                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {/* Price and Warranty */}
                    <div className="flex justify-between items-baseline bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <div>
                           <p className="text-sm text-gray-500 dark:text-gray-400">Harga</p>
                           <p className="text-4xl font-extrabold text-cyan-500">{item.price}</p>
                        </div>
                         <div className="text-right">
                           <p className="text-sm text-gray-500 dark:text-gray-400">Garansi</p>
                           <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{item.warranty}</p>
                        </div>
                    </div>
                    
                    {/* Stock Info */}
                    <div className={`p-3 rounded-lg text-center font-semibold ${isOutOfStock ? 'bg-red-100 dark:bg-red-900/50 text-red-600' : isLowStock ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600' : 'bg-green-100 dark:bg-green-900/50 text-green-600'}`}>
                        {isOutOfStock ? (
                            'Stok Habis'
                        ) : isLowStock ? (
                            `Stok menipis! Hanya tersisa ${item.currentStock} unit.`
                        ) : (
                            `Stok tersedia: ${item.currentStock} unit`
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">Deskripsi</h3>
                        <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Fitur Termasuk</h3>
                        <ul className="space-y-1">
                            {item.features.map((feature, i) => (
                                <li key={i} className="flex items-start justify-between group hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md transition-colors">
                                    <div className="flex items-start">
                                        <CheckmarkIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-600 dark:text-gray-300 ">{feature}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleFeatureClick(feature)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 rounded-full bg-cyan-100 dark:bg-cyan-900"
                                        aria-label={`Jelaskan fitur ${feature}`}
                                    >
                                        <SparklesIcon className="h-4 w-4 text-cyan-500" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Testimonials */}
                    {item.testimonials && item.testimonials.length > 0 && (
                        <div className="pt-4 border-t dark:border-gray-700">
                            <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Apa Kata Mereka</h3>
                            <div className="space-y-4">
                                {item.testimonials.map((testimonial, i) => (
                                    <blockquote key={i} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-cyan-500">
                                        <div className="flex items-start">
                                             <QuoteIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mr-3 flex-shrink-0" />
                                             <div>
                                                <p className="text-gray-700 dark:text-gray-200 italic">"{testimonial.quote}"</p>
                                                <cite className="mt-2 block text-right text-sm font-semibold text-gray-600 dark:text-gray-400 not-italic">- {testimonial.author}</cite>
                                             </div>
                                        </div>
                                    </blockquote>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <footer className="p-4 border-t dark:border-gray-700 flex-shrink-0">
                    {isOutOfStock ? (
                         <button disabled className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold py-3 rounded-lg cursor-not-allowed">
                            Stok Habis
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <div className="grid grid-cols-2 gap-3 flex-grow">
                                <button 
                                    onClick={() => onAddToCart(item.id)}
                                    className="w-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 font-semibold py-3 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/80 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShoppingCartIcon className="h-5 w-5" />
                                    Tambah Keranjang
                                </button>
                                 <button 
                                    onClick={() => onQuickBuy(item)}
                                    className="w-full bg-cyan-500 text-white font-semibold py-3 rounded-lg hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    Beli Cepat
                                    <ArrowRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                             <button 
                                onClick={() => onToggleWishlist(item.id)}
                                className="w-14 h-auto flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex-shrink-0"
                                aria-label={isWishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist"}
                            >
                                <HeartIcon className={`h-6 w-6 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                            </button>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default ProductDetailView;