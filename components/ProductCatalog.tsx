import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Item, Suggestion, FeedbackMessage, UserNotification, Reseller, Transaction } from '../types';
import { 
    NetflixIcon, YoutubeIcon, SpotifyIcon, DisneyPlusIcon, 
    CapcutIcon, CanvaIcon, ChatGPTIcon, GameControllerIcon, BriefcaseIcon,
    PriceTagIcon, CalculatorIcon, ShoppingCartIcon, CheckmarkIcon, WhatsAppIcon,
    StoreIcon, SparklesIcon, BellIcon, ChevronDownIcon, ChevronUpIcon, ArrowRightIcon,
    MenuIcon, XIcon, TrophyIcon, UserGroupIcon, HeartIcon, PuzzlePieceIcon
} from './Icons';
import { ThemeToggle } from './ThemeToggle';
import SuggestionBox from './SuggestionBox';
import UserNotificationPanel from './UserNotificationPanel';
import HelpWidget from './HelpWidget';

type CartItem = { itemId: number; quantity: number };

// Gemini API Key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert price string (e.g., "120k") to a number
const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    const numericString = priceStr.replace(/[^0-9]/g, '');
    let value = parseInt(numericString, 10);
    if (priceStr.toLowerCase().includes('k')) {
        value *= 1000;
    }
    return isNaN(value) ? 0 : value;
};

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const categoryInfo: Record<string, { icon: React.FC<any>, description: string, defaultProductIcon: React.FC<any> }> = {
    'Akun Streaming': { icon: DisneyPlusIcon, description: 'Nonton film dan serial favoritmu dari layanan streaming terbaik.', defaultProductIcon: DisneyPlusIcon },
    'Lisensi Produktivitas': { icon: BriefcaseIcon, description: 'Tingkatkan kreativitas dan produktivitas dengan software premium.', defaultProductIcon: BriefcaseIcon },
    'Voucher Game': { icon: GameControllerIcon, description: 'Top-up game favoritmu dengan mudah, aman, dan cepat.', defaultProductIcon: GameControllerIcon },
    'Lain-lain': { icon: SparklesIcon, description: 'Berbagai layanan digital lainnya untuk kebutuhanmu.', defaultProductIcon: SparklesIcon },
};

const productIconMap: Record<string, React.FC<any>> = {
    'Disney+ Hotstar': DisneyPlusIcon,
    'Netflix': NetflixIcon,
    'CapCut Pro': CapcutIcon,
    'Canva Pro': CanvaIcon,
    'ChatGPT Plus': ChatGPTIcon,
    'YouTube Premium': YoutubeIcon,
    'Spotify Premium': SpotifyIcon,
    'Mobile Legends': GameControllerIcon,
};


const ProductPlanCard: React.FC<{
    plan: Item;
    onAddToCart: (itemId: number) => void;
    onQuickBuy: (item: Item) => void;
    onSelectItemDetail: (item: Item) => void;
    onExplainFeature: (feature: string) => void;
    onToggleWishlist: (itemId: number) => void;
    isOutOfStock: boolean;
    isLowStock: boolean;
    isWishlisted: boolean;
}> = ({ plan, onAddToCart, onQuickBuy, onSelectItemDetail, onExplainFeature, onToggleWishlist, isOutOfStock, isLowStock, isWishlisted }) => {
    
    return (
        <div className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col h-full border border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all transform hover:-translate-y-1 ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}>
             <button 
                onClick={(e) => { e.stopPropagation(); onToggleWishlist(plan.id); }}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/50 dark:bg-gray-900/50 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors z-10"
                aria-label={isWishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist"}
            >
                <HeartIcon className={`h-6 w-6 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
            </button>
            <div onClick={() => onSelectItemDetail(plan)} className="cursor-pointer flex-grow flex flex-col">
                <div className="flex-shrink-0">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white pr-8">{plan.planName}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.warranty}</p>
                    <p className="text-4xl font-extrabold text-cyan-500 mb-4">{plan.price}</p>
                    <div className="text-sm mb-6">
                        {isOutOfStock ? (
                            <p className="font-bold text-red-500">Stok Habis</p>
                        ) : isLowStock ? (
                            <p className="font-semibold text-orange-500">Stok menipis: {plan.currentStock} tersisa</p>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Stok tersedia: {plan.currentStock}</p>
                        )}
                    </div>
                </div>
                 <ul className="space-y-3 text-gray-600 dark:text-gray-300 flex-grow">
                    {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start justify-between group">
                            <div className="flex items-start">
                                <CheckmarkIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                            </div>
                             <button 
                                onClick={(e) => { e.stopPropagation(); onExplainFeature(feature); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 rounded-full bg-cyan-100 dark:bg-cyan-900 flex-shrink-0"
                                aria-label={`Jelaskan fitur ${feature}`}
                            >
                                <SparklesIcon className="h-4 w-4 text-cyan-500" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
             <div className="mt-6 flex-shrink-0">
                {isOutOfStock ? (
                    <button disabled className="w-full text-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold py-3 rounded-lg cursor-not-allowed">
                        Stok Habis
                    </button>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => onQuickBuy(plan)} className="w-full text-center bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 font-semibold py-3 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/80 transition-colors flex items-center justify-center gap-2">
                            Beli Cepat
                            <ArrowRightIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => onAddToCart(plan.id)} className="w-full text-center bg-cyan-500 text-white font-semibold py-3 rounded-lg hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2">
                            <ShoppingCartIcon className="h-5 w-5" /> Keranjang
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductCard: React.FC<{ groupName: string; plans: Item[], onAddToCart: (itemId: number) => void; onQuickBuy: (item: Item) => void; onSelectItemDetail: (item: Item) => void; onExplainFeature: (feature: string) => void; wishlist: number[]; onToggleWishlist: (itemId: number) => void; }> = ({ groupName, plans, onAddToCart, onQuickBuy, onSelectItemDetail, onExplainFeature, wishlist, onToggleWishlist }) => {
    const [isOpen, setIsOpen] = useState(true); // Default to open
    const firstPlan = plans[0];
    const ProductIcon = productIconMap[groupName] || categoryInfo[firstPlan.category]?.defaultProductIcon || SparklesIcon;
    const description = plans.map(p => p.planName).join(', ');

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl shadow-md overflow-hidden transition-shadow hover:shadow-xl">
            <button 
                className="w-full text-left p-6"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <ProductIcon className="h-10 w-10 text-cyan-500 flex-shrink-0" />
                        <div className="min-w-0">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{groupName}</h3>
                            <p className="text-gray-600 dark:text-gray-400 truncate">{description}</p>
                        </div>
                    </div>
                    {isOpen ? <ChevronUpIcon className="h-6 w-6 text-gray-500 flex-shrink-0" /> : <ChevronDownIcon className="h-6 w-6 text-gray-500 flex-shrink-0" />}
                </div>
            </button>
            {isOpen && (
                <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(plan => {
                            const isOutOfStock = plan.currentStock <= 0;
                            const isLowStock = !isOutOfStock && plan.currentStock <= plan.minStock;
                            const isWishlisted = wishlist.includes(plan.id);
                            return (
                                <ProductPlanCard 
                                    key={plan.id} 
                                    plan={plan} 
                                    onAddToCart={onAddToCart} 
                                    onQuickBuy={onQuickBuy} 
                                    onSelectItemDetail={onSelectItemDetail} 
                                    onExplainFeature={onExplainFeature} 
                                    onToggleWishlist={onToggleWishlist}
                                    isOutOfStock={isOutOfStock}
                                    isLowStock={isLowStock}
                                    isWishlisted={isWishlisted}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

const CategorySection: React.FC<{ category: string; groups: Item[][]; onAddToCart: (itemId: number) => void; onQuickBuy: (item: Item) => void; onSelectItemDetail: (item: Item) => void; onExplainFeature: (feature: string) => void; wishlist: number[]; onToggleWishlist: (itemId: number) => void; defaultOpen?: boolean }> = ({ category, groups, onAddToCart, onQuickBuy, onSelectItemDetail, onExplainFeature, wishlist, onToggleWishlist, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const info = categoryInfo[category] || categoryInfo['Lain-lain'];
    const CategoryIcon = info.icon;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border dark:border-gray-700 fade-in-card">
            <button
                className="w-full p-6 flex justify-between items-center text-left"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-4">
                    <CategoryIcon className="h-10 w-10 text-cyan-500" />
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{category}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{info.description}</p>
                    </div>
                </div>
                {isOpen ? <ChevronUpIcon className="h-7 w-7 text-gray-500" /> : <ChevronDownIcon className="h-7 w-7 text-gray-500" />}
            </button>
            {isOpen && (
                 <div className="p-6 pt-0 space-y-8">
                    {groups.map(plans => (
                        <ProductCard key={plans[0].groupName} groupName={plans[0].groupName} plans={plans} onAddToCart={onAddToCart} onQuickBuy={onQuickBuy} onSelectItemDetail={onSelectItemDetail} onExplainFeature={onExplainFeature} wishlist={wishlist} onToggleWishlist={onToggleWishlist} />
                    ))}
                </div>
            )}
        </div>
    )
}

interface ProductCatalogProps {
    items: Item[];
    resellers: Reseller[];
    transactions: Transaction[];
    onSwitchToStock: () => void;
    onSwitchToReseller: () => void;
    onSwitchToRefund: () => void;
    suggestions: Suggestion[];
    onAddSuggestion: (suggestionData: Omit<Suggestion, 'id'>) => void;
    onUpdateSuggestion: (updatedSuggestion: Suggestion) => void;
    onDeleteSuggestion: (suggestionId: number) => void;
    setFeedback: (feedback: FeedbackMessage | null) => void;
    userNotifications: UserNotification[];
    onMarkNotificationAsRead: (id: number) => void;
    onMarkAllNotificationsAsRead: () => void;
    onDeleteUserNotification: (id: number) => void;
    cart: CartItem[];
    onAddToCart: (itemId: number) => void;
    onQuickBuy: (item: Item) => void;
    onToggleCart: () => void;
    wishlist: number[];
    onToggleWishlist: (itemId: number) => void;
    onToggleWishlistPanel: () => void;
    onSelectItemDetail: (item: Item) => void;
    onOpenBundleBuilder: () => void;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ 
    items,
    resellers,
    transactions,
    onSwitchToStock, 
    onSwitchToReseller, 
    onSwitchToRefund,
    suggestions,
    onAddSuggestion,
    onUpdateSuggestion,
    onDeleteSuggestion,
    setFeedback,
    userNotifications,
    onMarkNotificationAsRead,
    onMarkAllNotificationsAsRead,
    onDeleteUserNotification,
    cart,
    onAddToCart,
    onQuickBuy,
    onToggleCart,
    wishlist,
    onToggleWishlist,
    onToggleWishlistPanel,
    onSelectItemDetail,
    onOpenBundleBuilder,
}) => {
    const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] = useState(false);
    const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
    const [explainingFeature, setExplainingFeature] = useState<{ feature: string; description: string; isLoading: boolean } | null>(null);
    const [sortOption, setSortOption] = useState('default');


    const handleExplainFeature = async (feature: string) => {
        setExplainingFeature({ feature, description: '', isLoading: true });
        try {
            const prompt = `Jelaskan secara singkat (1-2 kalimat) dan sederhana apa arti dari fitur produk berikut untuk pelanggan: "${feature}". Fokus pada manfaat utamanya.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setExplainingFeature({ feature, description: response.text, isLoading: false });
        } catch (error) {
            console.error("Error generating feature description:", error);
            setExplainingFeature({ feature, description: 'Tidak dapat memuat penjelasan. Silakan coba lagi.', isLoading: false });
        }
    };

    const closeExplainFeatureModal = () => {
        setExplainingFeature(null);
    };

    const unreadCount = userNotifications.filter(n => !n.read).length;
    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const wishlistItemCount = wishlist.length;

    const { categoriesWithCount, groupedData } = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const visibleItems = items.filter(item => 
            item.isVisibleInStore && 
            (item.name.toLowerCase().includes(lowerCaseSearchTerm) || 
             item.groupName.toLowerCase().includes(lowerCaseSearchTerm) ||
             item.category.toLowerCase().includes(lowerCaseSearchTerm))
        );
    
        const allProductGroups = new Set<string>();
        const categoryCounts: Record<string, Set<string>> = {};
        visibleItems.forEach(item => {
            allProductGroups.add(item.groupName);
            if (!categoryCounts[item.category]) {
                categoryCounts[item.category] = new Set();
            }
            categoryCounts[item.category].add(item.groupName);
        });
    
        const existingCategories = Object.keys(categoryInfo).filter(catName => categoryCounts[catName]?.size > 0);
    
        const categoriesWithCount = [
            { name: 'All', count: allProductGroups.size },
            ...existingCategories.map(catName => ({
                name: catName,
                count: categoryCounts[catName].size
            }))
        ];
        
        const filteredByCategory = activeCategory === 'All'
            ? visibleItems
            : visibleItems.filter(item => item.category === activeCategory);
    
        const itemsByCategory = filteredByCategory.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {} as Record<string, Item[]>);
        
        const data = Object.entries(itemsByCategory).map(([category, itemsInCategory]) => {
            const itemsByGroup = (itemsInCategory as Item[]).reduce((acc, item) => {
                (acc[item.groupName] = acc[item.groupName] || []).push(item);
                return acc;
            }, {} as Record<string, Item[]>);
            
            Object.values(itemsByGroup).forEach(plans => {
                plans.sort((a, b) => {
                    switch (sortOption) {
                        case 'name-asc': return a.planName.localeCompare(b.planName);
                        case 'name-desc': return b.planName.localeCompare(a.planName);
                        case 'price-asc': return parsePrice(a.price) - parsePrice(b.price);
                        case 'price-desc': return parsePrice(b.price) - parsePrice(a.price);
                        case 'stock-desc': return b.currentStock - a.currentStock;
                        case 'stock-asc': return a.currentStock - b.currentStock;
                        default: return 0;
                    }
                });
            });
    
            return { category, groups: Object.values(itemsByGroup) };
        });
    
        return { categoriesWithCount, groupedData: data };
    }, [items, searchTerm, activeCategory, sortOption]);

    const topResellers = useMemo(() => {
        return resellers
            .map(reseller => {
                const sales = transactions
                    .filter(t => t.resellerId === reseller.id)
                    .reduce((sum, t) => sum + t.quantity, 0);
                return { ...reseller, sales };
            })
            .filter(r => r.sales > 0)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5); // Get top 5
    }, [resellers, transactions]);

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
             {explainingFeature && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
                    onClick={closeExplainFeatureModal}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-6 w-full max-w-sm border dark:border-gray-700" 
                        onClick={e => e.stopPropagation()}
                    >
                        <h4 className="font-bold text-lg text-cyan-500">{explainingFeature.feature}</h4>
                        <div className="mt-4 min-h-[60px] flex items-center">
                            {explainingFeature.isLoading ? (
                                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                    <Spinner />
                                    <span>Memuat penjelasan dari AI...</span>
                                </div>
                            ) : (
                                <p className="text-gray-700 dark:text-gray-300">{explainingFeature.description}</p>
                            )}
                        </div>
                        <button 
                            onClick={closeExplainFeatureModal} 
                            className="mt-4 w-full bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition-colors"
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            )}

            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <StoreIcon className="h-8 w-8 text-cyan-500" />
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Futo Premium</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <ThemeToggle />
                        <div className="relative">
                            <button onClick={() => setNotificationPanelOpen(prev => !prev)} className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full">
                                <BellIcon className="h-6 w-6"/>
                                {unreadCount > 0 && (
                                     <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                                )}
                            </button>
                            <UserNotificationPanel 
                                isOpen={isNotificationPanelOpen}
                                onClose={() => setNotificationPanelOpen(false)}
                                notifications={userNotifications}
                                onMarkAsRead={onMarkNotificationAsRead}
                                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                                onDelete={onDeleteUserNotification}
                            />
                        </div>
                        <button onClick={onToggleWishlistPanel} className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full">
                            <HeartIcon className="h-6 w-6"/>
                            {wishlistItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    {wishlistItemCount}
                                </span>
                            )}
                        </button>
                        <button onClick={onToggleCart} className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full">
                            <ShoppingCartIcon className="h-6 w-6"/>
                             {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                        
                        {/* Desktop Admin Menu */}
                        <div className="relative hidden md:inline-block">
                            <button
                                onClick={() => setIsDesktopMenuOpen(prev => !prev)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <BriefcaseIcon className="h-5 w-5" />
                                <span>Admin</span>
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${isDesktopMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDesktopMenuOpen && (
                                <div 
                                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700"
                                    onMouseLeave={() => setIsDesktopMenuOpen(false)}
                                >
                                    <a onClick={() => { onSwitchToStock(); setIsDesktopMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Stok Manajemen</a>
                                    <a onClick={() => { onSwitchToReseller(); setIsDesktopMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Panduan Reseller</a>
                                    <a onClick={() => { onSwitchToRefund(); setIsDesktopMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Kalkulator Refund</a>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button onClick={() => setIsMobileMenuOpen(prev => !prev)} className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full">
                           {isMobileMenuOpen ? <XIcon className="h-6 w-6"/> : <MenuIcon className="h-6 w-6"/>}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Panel */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-[69px] bg-gray-100 dark:bg-gray-900 z-30 md:hidden">
                    <nav className="container mx-auto px-6 py-8 flex flex-col gap-6">
                        <a onClick={() => { onSwitchToStock(); setIsMobileMenuOpen(false); }} className="text-lg text-gray-700 dark:text-gray-200 hover:text-cyan-500 font-medium cursor-pointer">Stok Manajemen</a>
                        <a onClick={() => { onSwitchToReseller(); setIsMobileMenuOpen(false); }} className="text-lg text-gray-700 dark:text-gray-200 hover:text-cyan-500 font-medium cursor-pointer">Panduan Reseller</a>
                        <a onClick={() => { onSwitchToRefund(); setIsMobileMenuOpen(false); }} className="text-lg text-gray-700 dark:text-gray-200 hover:text-cyan-500 font-medium cursor-pointer">Kalkulator Refund</a>
                    </nav>
                </div>
            )}


            <main className="container mx-auto px-6 py-12">
                {/* Hero Banner */}
                <div className="text-center mb-12 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animated-gradient-bg">
                    <h2 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl drop-shadow-lg">
                        Marketplace <span className="text-cyan-300">Layanan Digital</span> Terlengkap
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-200 dark:text-gray-300 drop-shadow-md">
                        Pilih paket langganan favoritmu dengan harga terbaik, aman, dan bergaransi. Pesan instan via WhatsApp.
                    </p>
                </div>

                {/* Bundle Builder CTA */}
                <div className="my-12">
                    <button
                        onClick={onOpenBundleBuilder}
                        className="w-full p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col md:flex-row items-center justify-between text-left gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <PuzzlePieceIcon className="h-12 w-12 text-cyan-500 flex-shrink-0" />
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Buat Paket Hemat Sendiri!</h3>
                                <p className="text-gray-600 dark:text-gray-400">Pilih 2 item atau lebih dan dapatkan diskon hingga 15%.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold">
                            <span>Mulai Merakit</span>
                            <ArrowRightIcon className="h-4 w-4" />
                        </div>
                    </button>
                </div>
                
                {/* Reseller Section */}
                {topResellers.length > 0 && (
                    <div className="my-12 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <TrophyIcon className="h-8 w-8 text-yellow-500" />
                                Reseller Teratas
                            </h3>
                            <button
                                onClick={onSwitchToReseller}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-semibold"
                            >
                                <UserGroupIcon className="h-5 w-5" />
                                <span>Lihat Panduan Reseller</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {topResellers.map((reseller, index) => (
                                <div key={reseller.id} className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                                    <p className="font-bold text-lg text-gray-800 dark:text-white truncate">{index + 1}. {reseller.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold text-cyan-500">{reseller.sales}</span> penjualan
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search and Filter */}
                <div className="mb-12 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md sticky top-[70px] z-30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Cari produk favoritmu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                        />
                         <select
                            aria-label="Sort products"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                        >
                            <option value="default">Urutkan Berdasarkan...</option>
                            <option value="name-asc">Nama (A-Z)</option>
                            <option value="name-desc">Nama (Z-A)</option>
                            <option value="price-asc">Harga (Rendah ke Tinggi)</option>
                            <option value="price-desc">Harga (Tinggi ke Rendah)</option>
                            <option value="stock-desc">Stok (Banyak ke Sedikit)</option>
                            <option value="stock-asc">Stok (Sedikit ke Banyak)</option>
                        </select>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {categoriesWithCount.map(({ name, count }) => (
                            <button
                                key={name}
                                onClick={() => setActiveCategory(name)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 ${
                                    activeCategory === name
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {name}
                                <span className={`px-2 py-0.5 text-xs rounded-full ${activeCategory === name ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="space-y-12">
                    {groupedData.length > 0 ? (
                        groupedData.map(({ category, groups }, index) => (
                            <CategorySection 
                                key={category} 
                                category={category} 
                                groups={groups}
                                onAddToCart={onAddToCart}
                                onQuickBuy={onQuickBuy}
                                onSelectItemDetail={onSelectItemDetail}
                                onExplainFeature={handleExplainFeature}
                                wishlist={wishlist}
                                onToggleWishlist={onToggleWishlist}
                                defaultOpen={index === 0}
                            />
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                            <h3 className="text-2xl font-bold">Oops! Produk tidak ditemukan.</h3>
                            <p className="text-gray-500 mt-2">Coba kata kunci atau filter lain.</p>
                        </div>
                    )}
                </div>
            </main>

            <SuggestionBox 
                isOpen={isSuggestionBoxOpen}
                onClose={() => setIsSuggestionBoxOpen(false)}
                suggestions={suggestions}
                onAdd={onAddSuggestion}
                onUpdate={onUpdateSuggestion}
                onDelete={onDeleteSuggestion}
                setFeedback={setFeedback}
            />

            <HelpWidget />

            <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-16">
                <div className="container mx-auto px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                     <button onClick={() => setIsSuggestionBoxOpen(true)} className="mb-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/50 rounded-full hover:bg-cyan-200 dark:hover:bg-cyan-900/80 transition-colors">
                        <SparklesIcon className="h-5 w-5"/>
                        Punya saran untuk aplikasi ini? Klik di sini!
                    </button>
                    <p>&copy; {new Date().getFullYear()} Futo Premium. Dibuat dengan cinta untuk para reseller.</p>
                </div>
            </footer>
        </div>
    );
};

export default ProductCatalog;