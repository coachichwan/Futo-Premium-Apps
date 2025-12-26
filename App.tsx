import React, { useState, useEffect } from 'react';
import { Item, Transaction, TransactionType, FeedbackMessage, Suggestion, UserNotification, AlertConfigType, Reseller, Discount, PakasirOrder } from './types';
import StockManagement from './components/StockManagement';
import ProductCatalog from './components/ProductCatalog';
import ResellerGuide from './components/ResellerGuide';
import RefundCalculator from './components/RefundCalculator';
import { NotificationProvider } from './contexts/NotificationContext';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import ProductDetailView from './components/ProductDetailView';
import BundleBuilder from './components/BundleBuilder';
import Pakasir from './components/Pakasir';
import PakasirHistory from './components/PakasirHistory';
import AgencyDashboard from './components/AgencyDashboard';
import { StoreIcon, DashboardIcon, UserGroupIcon, CalculatorIcon, EllipsisVerticalIcon, UserIcon as ResellerGuideIcon } from './components/Icons';


// A simple hook to persist state to localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Ensure we don't return null from a parsed "null" string, fall back to initialValue
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed !== null) {
            return parsed;
        }
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const defaultAlertConfig = { type: AlertConfigType.DEFAULT, value: 0 };

const initialItems: Item[] = [
    // Disney+
    { id: 1, name: 'Disney+ - Premium Private', unit: 'Akun', minStock: 5, currentStock: 15, description: 'Akun pribadi, bisa untuk semua device, kualitas 4K UHD.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Akun Streaming', groupName: 'Disney+ Hotstar', planName: 'Premium Private', price: '25k', warranty: 'Garansi 1 Bulan', features: ['Akun pribadi (1 user)', 'Kualitas 4K UHD', 'Bisa di semua device'], isVisibleInStore: true
    },
    { id: 2, name: 'Disney+ - Sharing', unit: 'Akun', minStock: 10, currentStock: 25, description: 'Akun sharing, login di 1 device, kualitas 4K UHD.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Akun Streaming', groupName: 'Disney+ Hotstar', planName: 'Sharing', price: '10k', warranty: 'Garansi 1 Bulan', features: ['Akun sharing (maks. 5 user)', 'Kualitas 4K UHD', 'Login di 1 device'], isVisibleInStore: true
    },
    // Netflix
    { id: 3, name: 'Netflix - Private', unit: 'Akun', minStock: 5, currentStock: 8, description: 'Akun private, kualitas 4K UHD+HDR, bisa di semua device.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Akun Streaming', groupName: 'Netflix', planName: 'Private', price: '120k', warranty: 'Garansi 1 Bulan', features: ['Private account', 'Kualitas 4K UHD+HDR', 'Bisa di semua device'], isVisibleInStore: true,
        testimonials: [
            { author: 'Budi S.', quote: 'Prosesnya cepet banget, adminnya ramah, dan akunnya beneran private. Lancar jaya nonton 4K tanpa buffer. Recommended!' },
            { author: 'Sari W.', quote: 'Udah langganan 3 bulan di sini, gak pernah ada masalah. Kualitasnya UHD beneran, bisa dipakai di Smart TV sama HP. Mantap!' }
        ]
    },
    { id: 4, name: 'Netflix - 1P1U Request Nama & PIN', unit: 'Akun', minStock: 10, currentStock: 18, description: '1 profil untuk 1 user, bisa request nama profil & PIN, kualitas 4K UHD+HDR.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Akun Streaming', groupName: 'Netflix', planName: '1P1U Request Nama & PIN', price: '45k', warranty: 'Garansi 1 Bulan', features: ['1 profil untuk 1 user', 'Bisa request nama profil & PIN', 'Kualitas 4K UHD+HDR'], isVisibleInStore: true
    },
    { id: 5, name: 'Netflix - Sharing', unit: 'Akun', minStock: 15, currentStock: 3, description: '1 akun untuk 10 user, dilarang ganti password, kualitas 4K UHD+HDR.', alertConfig: { type: AlertConfigType.QUANTITY, value: 5 }, icon: '',
        category: 'Akun Streaming', groupName: 'Netflix', planName: 'Sharing', price: '30k', warranty: 'Garansi 1 Bulan', features: ['1 akun untuk 10 user', 'Dilarang ganti password', 'Kualitas 4K UHD+HDR'], isVisibleInStore: true
    },
    // CapCut Pro
    { id: 6, name: 'CapCut Pro - 7 Hari Hemat', unit: 'Lisensi', minStock: 20, currentStock: 50, description: 'Akses 7 hari full premium, tanpa watermark, via join team.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Lisensi Produktivitas', groupName: 'CapCut Pro', planName: '7 Hari Hemat', price: '5k', warranty: 'Akses 7 hari', features: ['Full premium', 'Tanpa watermark', 'Join team'], isVisibleInStore: true
    },
    { id: 7, name: 'CapCut Pro - 30 Hari Best Seller', unit: 'Lisensi', minStock: 10, currentStock: 40, description: 'Akses 30 hari, Garansi 7 hari, via join team.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Lisensi Produktivitas', groupName: 'CapCut Pro', planName: '30 Hari Best Seller', price: '15k', warranty: 'Garansi 7 hari', features: ['Full premium', 'Tanpa watermark', 'Join team'], isVisibleInStore: true,
        testimonials: [
            { author: 'Rian H.', quote: 'Fitur pro-nya kebuka semua, edit video jadi gampang banget tanpa watermark. Harganya juga murah meriah. Puas banget!' },
            { author: 'Dita A.', quote: 'Awalnya ragu, tapi ternyata beneran amanah. Join team-nya gampang, langsung bisa ekspor kualitas tinggi. Makasih Futo!' }
        ]
    },
    { id: 8, name: 'CapCut Pro - 30 Hari Full Garansi', unit: 'Lisensi', minStock: 10, currentStock: 35, description: 'Akses 30 hari, Garansi 25 Hari, via join team.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Lisensi Produktivitas', groupName: 'CapCut Pro', planName: '30 Hari Full Garansi', price: '20k', warranty: 'Garansi 25 Hari', features: ['Full premium', 'Tanpa watermark', 'Join team'], isVisibleInStore: true
    },
    // Canva
    { id: 9, name: 'Canva - MEMBER + DESIGNER', unit: 'Lisensi', minStock: 10, currentStock: 2, description: '', alertConfig: defaultAlertConfig, icon: '',
        category: 'Lisensi Produktivitas', groupName: 'Canva Pro', planName: 'MEMBER + DESIGNER', price: '10k', warranty: 'Garansi 1 Bulan', features: ['Via invite email', 'Full Pro features'], isVisibleInStore: true
    },
    { id: 10, name: 'Canva - PRO OWNER', unit: 'Lisensi', minStock: 5, currentStock: 12, description: '', alertConfig: defaultAlertConfig, icon: '',
        category: 'Lisensi Produktivitas', groupName: 'Canva Pro', planName: 'PRO OWNER', price: '25k', warranty: 'Garansi 30 Hari', features: ['Akun owner', 'Bisa invite member', 'Full Pro features'], isVisibleInStore: true,
         testimonials: [
            { author: 'Andika P.', quote: 'Gila sih, dengan harga segini bisa jadi owner tim. Invite teman-teman jadi gampang, fitur pro-nya lengkap pol. Wajib coba buat yang sering desain.' }
        ]
    },
    // ChatGPT
    { id: 11, name: 'ChatGPT - TEAM FAMPLAN', unit: 'Lisensi', minStock: 8, currentStock: 15, description: '', alertConfig: defaultAlertConfig, icon: '',
        category: 'Lisensi Produktivitas', groupName: 'ChatGPT Plus', planName: 'TEAM FAMPLAN', price: '80k', warranty: 'Garansi 1 Bulan', features: ['Via invite email', 'Akses GPT-4o', 'Limit lebih tinggi'], isVisibleInStore: true
    },
    { id: 12, name: 'ChatGPT - PLUS GARANSI', unit: 'Lisensi', minStock: 5, currentStock: 10, description: '', alertConfig: defaultAlertConfig, icon: '',
        category: 'Lisensi Produktivitas', groupName: 'ChatGPT Plus', planName: 'PLUS GARANSI', price: '150k', warranty: 'Garansi 1 Bulan', features: ['Akun dari seller', 'Akses GPT-4o', 'Full garansi'], isVisibleInStore: true
    },
    // YouTube
    { id: 13, name: 'YouTube - 1 Bulan Via Invite', unit: 'Lisensi', minStock: 15, currentStock: 28, description: 'Nonton tanpa iklan, termasuk YouTube Music, via invite family.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Akun Streaming', groupName: 'YouTube Premium', planName: '1 Bulan Via Invite', price: '15k', warranty: 'Garansi 1 Bulan', features: ['Via invite family', 'Termasuk YouTube Music'], isVisibleInStore: true
    },
    { id: 14, name: 'YouTube - 3 Bulan Individual', unit: 'Lisensi', minStock: 10, currentStock: 19, description: 'Akun dari seller, garansi penuh 3 bulan, termasuk YouTube Music.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Akun Streaming', groupName: 'YouTube Premium', planName: '3 Bulan Individual', price: '40k', warranty: 'Garansi 3 Bulan', features: ['Akun dari seller', 'Termasuk YouTube Music'], isVisibleInStore: true
    },
    // Spotify
    { id: 15, name: 'Spotify - INDPLAN Student', unit: 'Akun', minStock: 5, currentStock: 11, description: '', alertConfig: defaultAlertConfig, icon: '',
        category: 'Akun Streaming', groupName: 'Spotify Premium', planName: 'INDPLAN Student', price: '20k', warranty: 'Garansi 1 Bulan', features: ['Akun private', 'Full Garansi'], isVisibleInStore: true
    },
    // New Item Example
    { id: 16, name: 'Mobile Legends - 86 Diamonds', unit: 'Diamond', minStock: 100, currentStock: 1000, description: 'Top up 86 Diamonds untuk Mobile Legends.', alertConfig: defaultAlertConfig, icon: '',
        category: 'Voucher Game', groupName: 'Mobile Legends', planName: '86 Diamonds', price: '25k', warranty: 'Proses Cepat', features: ['Legal & Aman', 'Input User ID & Zone ID'], isVisibleInStore: true
    },
];


const initialTransactions: Transaction[] = [];

const initialSuggestions: Suggestion[] = [
    { id: 1, title: "Integrasi Pembayaran Otomatis", description: "Menambahkan gateway pembayaran seperti Midtrans atau Xendit agar pelanggan bisa langsung bayar dari katalog produk tanpa harus chat manual." },
    { id: 2, title: "Notifikasi Stok via Telegram", description: "Membuat bot Telegram yang akan mengirimkan pemberitahuan otomatis ketika stok suatu item mencapai batas minimum." }
];

const initialUserNotifications: UserNotification[] = [
    { id: 1, message: 'Rilisan Baru: Langganan Adobe Creative Cloud sekarang tersedia!', date: new Date(Date.now() - 86400000 * 1).toISOString(), read: false },
    { id: 2, message: 'Langganan Netflix Private Anda akan berakhir dalam 3 hari. Segera perpanjang!', date: new Date(Date.now() - 86400000 * 2).toISOString(), read: false },
    { id: 3, message: 'Selamat! Anda telah menjadi pelanggan setia selama 6 bulan.', date: new Date(Date.now() - 86400000 * 5).toISOString(), read: true },
];

const initialResellers: Reseller[] = [
    { id: 1, name: 'Andi Digital Store', whatsappNumber: '6281234567890', joinDate: new Date('2023-01-15').toISOString(), commissionRate: 10, status: 'active' },
    { id: 2, name: 'Berkah Premium', whatsappNumber: '6281298765432', joinDate: new Date('2023-03-22').toISOString(), commissionRate: 15, status: 'active' },
];

const initialDiscounts: Discount[] = [
    { id: '1', code: 'HEMAT10', type: 'percentage', value: 10, minPurchase: 50000, isActive: true },
    { id: '2', code: 'FUTOPREMIUM', type: 'fixed', value: 15000, minPurchase: 100000, isActive: true },
    { id: '3', code: 'TIDAKAKTIF', type: 'percentage', value: 20, minPurchase: 0, isActive: false },
];

type CartItem = { itemId: number; quantity: number };

type View = 'store' | 'stock' | 'reseller' | 'refund' | 'reseller-guide' | 'pakasir' | 'pakasir-history' | 'agency-dashboard';

const mobileNavItems = [
    { id: 'store', label: 'Store', icon: StoreIcon },
    { id: 'pakasir', label: 'Pakasir', icon: CalculatorIcon },
    { id: 'stock', label: 'Stok', icon: DashboardIcon },
    { id: 'more', label: 'Lainnya', icon: EllipsisVerticalIcon },
];

function App() {
    const [items, setItems] = useLocalStorage<Item[]>('stock-items', initialItems);
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('stock-transactions', initialTransactions);
    const [suggestions, setSuggestions] = useLocalStorage<Suggestion[]>('app-suggestions', initialSuggestions);
    const [userNotifications, setUserNotifications] = useLocalStorage<UserNotification[]>('user-notifications', initialUserNotifications);
    const [resellers, setResellers] = useLocalStorage<Reseller[]>('stock-resellers', initialResellers);
    const [discounts, setDiscounts] = useLocalStorage<Discount[]>('stock-discounts', initialDiscounts);
    const [pakasirOrders, setPakasirOrders] = useLocalStorage<PakasirOrder[]>('pakasir-orders', []);
    const [activeView, setActiveView] = useState<View>('store');
    const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
    const [cart, setCart] = useLocalStorage<CartItem[]>('user-cart', []);
    const [wishlist, setWishlist] = useLocalStorage<number[]>('user-wishlist', []);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const [cartView, setCartView] = useState<'cart' | 'checkout' | 'success'>('cart');
    const [selectedItemDetail, setSelectedItemDetail] = useState<Item | null>(null);
    const [appliedDiscountCode, setAppliedDiscountCode] = useLocalStorage<string | null>('user-applied-discount', null);
    const [isBundleBuilderOpen, setIsBundleBuilderOpen] = useState(false);
    const [bundleDiscount, setBundleDiscount] = useLocalStorage<number>('bundle-discount', 0);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);


    // Data migration and validation for existing users
    useEffect(() => {
        const migrateData = () => {
            // Validate and migrate Items
            setItems(currentItems => {
                if (!Array.isArray(currentItems)) {
                    console.warn("Corrupted 'items' data in localStorage. Resetting to initial data.");
                    return initialItems;
                }
                const migrated = currentItems.map((item: any) => {
                    if (typeof item !== 'object' || item === null) return null; // Filter out invalid entries
                    if (typeof item.id === 'undefined' || typeof item.name === 'undefined') return null;

                    return {
                        ...item,
                        alertConfig: item.alertConfig || defaultAlertConfig,
                        icon: item.icon || '',
                        category: item.category || 'Lain-lain',
                        groupName: item.groupName || (item.name.split(' - ')[0] || 'Produk'),
                        planName: item.planName || (item.name.split(' - ')[1] || 'Standard'),
                        price: item.price || 'N/A',
                        warranty: item.warranty || 'N/A',
                        features: Array.isArray(item.features) ? item.features : [item.description],
                        isVisibleInStore: 'isVisibleInStore' in item ? item.isVisibleInStore : true, 
                        orderLink: item.orderLink || '',
                        testimonials: Array.isArray(item.testimonials) ? item.testimonials : [],
                    };
                });
                return migrated.filter(Boolean); // Filter out nulls
            });
            
            // Validate and migrate Resellers
            setResellers(currentResellers => {
                if (!Array.isArray(currentResellers)) return initialResellers;
                return currentResellers.map((reseller: any) => {
                    if (typeof reseller !== 'object' || reseller === null) return null;
                    // Add default status for old data
                    if (!('status' in reseller)) {
                        return { ...reseller, status: 'active', commissionRate: reseller.commissionRate || 10 };
                    }
                    return reseller;
                }).filter(Boolean);
            });

            // Add validation for all other array-based state to prevent crashes
            setTransactions(current => Array.isArray(current) ? current : initialTransactions);
            setSuggestions(current => Array.isArray(current) ? current : initialSuggestions);
            setUserNotifications(current => Array.isArray(current) ? current : initialUserNotifications);
            setDiscounts(current => Array.isArray(current) ? current : initialDiscounts);
            setCart(current => Array.isArray(current) ? current : []);
            setWishlist(current => Array.isArray(current) ? current.filter(id => typeof id === 'number') : []);
        };
        migrateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showFeedback = (feedback: FeedbackMessage | null) => {
        setFeedback(feedback);
        if (feedback) {
            setTimeout(() => setFeedback(null), 4000);
        }
    };

    // Item Handlers
    const handleAddItem = (itemData: Omit<Item, 'id'>) => {
        setItems(prev => [...prev, { ...itemData, id: Date.now() }]);
        showFeedback({ message: `Item "${itemData.name}" berhasil ditambahkan.`, type: 'success' });
    };

    const handleBulkAddItems = (newItems: Omit<Item, 'id'>[]) => {
        const itemsWithIds = newItems.map((item, index) => ({
            ...item,
            id: Date.now() + index,
        }));
        setItems(prev => [...prev, ...itemsWithIds]);
    };

    const handleUpdateItem = (updatedItem: Item) => {
        setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        showFeedback({ message: `Item "${updatedItem.name}" berhasil diperbarui.`, type: 'success' });
    };

    const handleBulkUpdateItems = (updatedItems: Item[]) => {
        setItems(prevItems => {
            const updatesMap = new Map(updatedItems.map(item => [item.id, item]));
            return prevItems.map(item => updatesMap.get(item.id) || item);
        });
        showFeedback({ message: `${updatedItems.length} deskripsi item berhasil diperbarui dengan AI.`, type: 'success' });
    };

    const handleDeleteItem = (itemId: number) => {
        const itemName = items.find(i => i.id === itemId)?.name || 'Item';
        if (window.confirm(`Yakin ingin menghapus "${itemName}"? Ini tidak bisa dibatalkan.`)) {
            setItems(prev => prev.filter(item => item.id !== itemId));
            showFeedback({ message: `Item "${itemName}" telah dihapus.`, type: 'success' });
        }
    };

    // Transaction Handler
    const handleAddTransaction = (txData: Omit<Transaction, 'id'>) => {
        const item = items.find(i => i.id === txData.itemId);
        if (!item) {
            showFeedback({ message: 'Item tidak ditemukan.', type: 'error' });
            return;
        }

        if (txData.type === TransactionType.OUT && item.currentStock < txData.quantity) {
            showFeedback({ message: `Stok untuk "${item.name}" tidak mencukupi. Sisa: ${item.currentStock}`, type: 'error' });
            return;
        }

        const newStock = txData.type === TransactionType.IN
            ? item.currentStock + txData.quantity
            : item.currentStock - txData.quantity;

        setItems(prev => prev.map(i => i.id === txData.itemId ? { ...i, currentStock: newStock } : i));
        setTransactions(prev => [{ ...txData, id: Date.now() }, ...prev]);
        showFeedback({ message: `Transaksi untuk "${item.name}" berhasil dicatat.`, type: 'success' });
    };

    // Reseller Handlers
    const handleAddReseller = (resellerData: Omit<Reseller, 'id' | 'joinDate' | 'status'>) => {
        const newReseller: Reseller = { 
            ...resellerData, 
            id: Date.now(), 
            joinDate: new Date().toISOString(),
            status: 'active'
        };
        setResellers(prev => [...prev, newReseller]);
        showFeedback({ message: `Reseller "${resellerData.name}" ditambahkan.`, type: 'success' });
    };

    const handleInviteReseller = (inviteData: { name: string; email: string; commissionRate: number; inviteCode: string }) => {
        const newReseller: Reseller = {
            id: Date.now(),
            name: inviteData.name,
            email: inviteData.email,
            whatsappNumber: '', // Empty until they complete signup
            joinDate: new Date().toISOString(),
            commissionRate: inviteData.commissionRate,
            status: 'pending',
            inviteCode: inviteData.inviteCode,
        };
        setResellers(prev => [...prev, newReseller]);
        showFeedback({ message: `Undangan untuk ${inviteData.name} telah dicatat.`, type: 'success' });
    };

    const handleUpdateReseller = (updatedReseller: Reseller) => {
        setResellers(prev => prev.map(r => r.id === updatedReseller.id ? updatedReseller : r));
        showFeedback({ message: `Data reseller "${updatedReseller.name}" diperbarui.`, type: 'success' });
    };

    const handleDeleteReseller = (resellerId: number) => {
        const name = resellers.find(r => r.id === resellerId)?.name || 'Reseller';
        if (window.confirm(`Yakin ingin menghapus reseller "${name}"?`)) {
            setResellers(prev => prev.filter(r => r.id !== resellerId));
            showFeedback({ message: `Reseller "${name}" dihapus.`, type: 'success' });
        }
    };
    
    // Discount Handlers
    const handleAddDiscount = (discountData: Omit<Discount, 'id'>) => {
        const newDiscount: Discount = { ...discountData, id: Date.now().toString() };
        setDiscounts(prev => [...prev, newDiscount]);
        showFeedback({ message: `Diskon "${discountData.code}" berhasil ditambahkan.`, type: 'success' });
    };

    const handleUpdateDiscount = (updatedDiscount: Discount) => {
        setDiscounts(prev => prev.map(d => d.id === updatedDiscount.id ? updatedDiscount : d));
        showFeedback({ message: `Diskon "${updatedDiscount.code}" berhasil diperbarui.`, type: 'success' });
    };

    const handleDeleteDiscount = (discountId: string) => {
        const code = discounts.find(d => d.id === discountId)?.code || 'Diskon';
        if (window.confirm(`Yakin ingin menghapus diskon "${code}"?`)) {
            setDiscounts(prev => prev.filter(d => d.id !== discountId));
            showFeedback({ message: `Diskon "${code}" dihapus.`, type: 'success' });
        }
    };

    // Suggestion Handlers
    const handleAddSuggestion = (suggestionData: Omit<Suggestion, 'id'>) => {
        setSuggestions(prev => [...prev, { ...suggestionData, id: Date.now() }]);
        showFeedback({ message: 'Saran Anda telah dikirim. Terima kasih!', type: 'success' });
    };

    const handleUpdateSuggestion = (updatedSuggestion: Suggestion) => {
        setSuggestions(prev => prev.map(s => s.id === updatedSuggestion.id ? updatedSuggestion : s));
    };

    const handleDeleteSuggestion = (id: number) => {
        setSuggestions(prev => prev.filter(s => s.id !== id));
    };
    
    // Notification Handlers
    const handleMarkNotificationAsRead = (id: number) => {
        setUserNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };
    
    const handleMarkAllNotificationsAsRead = () => {
        setUserNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };
    
    const handleDeleteUserNotification = (id: number) => {
        setUserNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Wishlist Handler
    const handleToggleWishlist = (itemId: number) => {
        setWishlist(prev => {
            const isWishlisted = prev.includes(itemId);
            if (isWishlisted) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    // Cart Handlers
    const handleAddToCart = (itemId: number) => {
        const item = items.find(i => i.id === itemId);
        if (!item || item.currentStock <= 0) {
            showFeedback({ message: `Maaf, stok untuk "${item?.name || 'item'}" sedang habis.`, type: 'error' });
            return;
        }
        setBundleDiscount(0); // Any manual cart addition breaks the bundle
        setAppliedDiscountCode(null);
        setCart(prev => {
            const existing = prev.find(item => item.itemId === itemId);
            if (existing) {
                return prev.map(item => item.itemId === itemId ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { itemId, quantity: 1 }];
        });
        showFeedback({ message: `"${item.name}" ditambahkan ke keranjang.`, type: 'success' });
    };

    const handleAddBundleToCart = (bundleItems: Item[], discount: number) => {
        // Replace current cart with the new bundle
        const newCartItems = bundleItems.map(item => ({ itemId: item.id, quantity: 1 }));
        setCart(newCartItems);
        setBundleDiscount(discount);
        setAppliedDiscountCode(null); // Clear any coupon code
        setIsBundleBuilderOpen(false);
        setIsCartOpen(true); // Open cart to show the result
        showFeedback({ type: 'success', message: 'Paket berhasil dibuat dan ditambahkan ke keranjang!' });
    };

    const handleQuickBuy = (item: Item) => {
        const adminWhatsApp = "6285779462118";
        const message = encodeURIComponent(`Halo, saya mau pesan cepat:\n\n*${item.name}*\nHarga: *${item.price}*\n\nMohon info ketersediaan stoknya. Terima kasih!`);
        window.open(`https://wa.me/${adminWhatsApp}?text=${message}`, '_blank');
        setSelectedItemDetail(null); // Close detail view if open
    };

    const handleUpdateCartQuantity = (itemId: number, quantity: number) => {
        setBundleDiscount(0); // Any manual cart modification breaks the bundle
        setAppliedDiscountCode(null);
        if (quantity <= 0) {
            setCart(prev => prev.filter(item => item.itemId !== itemId));
        } else {
            const item = items.find(i => i.id === itemId);
            if(item && quantity > item.currentStock) {
                showFeedback({ message: `Stok maksimal untuk "${item.name}" adalah ${item.currentStock}.`, type: 'error' });
                setCart(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity: item.currentStock } : i));
            } else {
                setCart(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity } : i));
            }
        }
    };
    
    const handleWhatsAppOrderSent = () => {
        setCart([]);
        setAppliedDiscountCode(null);
        setBundleDiscount(0);
        setCartView('success');
        showFeedback({ message: 'Pesanan Anda telah diformat untuk dikirim via WhatsApp.', type: 'success' });
    };

    const handleCreatePakasirOrder = (order: PakasirOrder) => {
        setPakasirOrders(prev => [order, ...prev]);
        showFeedback({ message: 'Pesanan berhasil dibuat!', type: 'success' });
    };

    const handleUpdatePakasirOrderStatus = (orderId: string, status: any) => {
        setPakasirOrders(prev =>
            prev.map(order =>
                order.id === orderId ? { ...order, paymentStatus: status } : order
            )
        );
    };

    const handleUpdateStockFromPakasir = (itemId: number, newStock: number) => {
        setItems(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, currentStock: newStock } : item
            )
        );
    };

    const MoreMenuModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        onNavigate: (view: View) => void;
    }> = ({ isOpen, onClose, onNavigate }) => {
        if (!isOpen) return null;
    
        const handleNavigate = (view: View) => {
            onNavigate(view);
            onClose();
        };
    
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4 md:hidden animate-fade-in" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
                    <div className="p-2">
                        <button onClick={() => handleNavigate('agency-dashboard')} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                            <DashboardIcon className="h-6 w-6 text-blue-500" />
                            <div>
                                <p className="font-semibold">Dashboard Keagenan</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Pantau performa penjualan.</p>
                            </div>
                        </button>
                        <button onClick={() => handleNavigate('pakasir-history')} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                            <CalculatorIcon className="h-6 w-6 text-green-500" />
                            <div>
                                <p className="font-semibold">Riwayat Pakasir</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Lihat semua transaksi.</p>
                            </div>
                        </button>
                        <button onClick={() => handleNavigate('reseller')} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                            <UserGroupIcon className="h-6 w-6 text-purple-500" />
                            <div>
                                <p className="font-semibold">Manajemen Reseller</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Kelola reseller dan komisi.</p>
                            </div>
                        </button>
                        <button onClick={() => handleNavigate('refund')} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                            <CalculatorIcon className="h-6 w-6 text-cyan-500" />
                            <div>
                                <p className="font-semibold">Kalkulator Refund</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Hitung pengembalian dana pelanggan.</p>
                            </div>
                        </button>
                        <button onClick={() => handleNavigate('reseller-guide')} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                            <ResellerGuideIcon className="h-6 w-6 text-orange-500" />
                            <div>
                                <p className="font-semibold">Panduan Reseller</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Mulai bisnismu sekarang.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderView = () => {
        const stockManagementProps = {
            items: items,
            transactions: transactions,
            resellers: resellers,
            discounts: discounts,
            onAddItem: handleAddItem,
            onUpdateItem: handleUpdateItem,
            onDeleteItem: handleDeleteItem,
            onAddTransaction: handleAddTransaction,
            onBulkAddItems: handleBulkAddItems,
            onBulkUpdateItems: handleBulkUpdateItems,
            onAddReseller: handleAddReseller,
            onInviteReseller: handleInviteReseller,
            onUpdateReseller: handleUpdateReseller,
            onDeleteReseller: handleDeleteReseller,
            onAddDiscount: handleAddDiscount,
            onUpdateDiscount: handleUpdateDiscount,
            onDeleteDiscount: handleDeleteDiscount,
            onSwitchToStore: () => setActiveView('store'),
            feedback: feedback,
            clearFeedback: () => setFeedback(null),
            setFeedback: setFeedback,
        };

        switch (activeView) {
            case 'stock':
                return <StockManagement {...stockManagementProps} initialView="dashboard" />;
            case 'reseller':
                return <StockManagement {...stockManagementProps} initialView="resellers" />;
            case 'refund':
                return <RefundCalculator items={items} onAddTransaction={handleAddTransaction} onSwitchToStore={() => setActiveView('store')} />;
            case 'reseller-guide':
                return <ResellerGuide onSwitchToStore={() => setActiveView('store')} />;
            case 'pakasir':
                return <Pakasir 
                    items={items}
                    discounts={discounts}
                    resellers={resellers}
                    orders={pakasirOrders}
                    onCreateOrder={handleCreatePakasirOrder}
                    onUpdateOrderStatus={handleUpdatePakasirOrderStatus}
                    onUpdateStock={handleUpdateStockFromPakasir}
                />;
            case 'pakasir-history':
                return <PakasirHistory orders={pakasirOrders} />;
            case 'agency-dashboard':
                return <AgencyDashboard orders={pakasirOrders} resellers={resellers} items={items} />;
            case 'store':
            default:
                return <ProductCatalog 
                            items={items} 
                            resellers={resellers}
                            transactions={transactions}
                            onSwitchToStock={() => setActiveView('stock')} 
                            onSwitchToReseller={() => setActiveView('reseller')}
                            onSwitchToRefund={() => setActiveView('refund')}
                            onSwitchToResellerGuide={() => setActiveView('reseller-guide')}
                            suggestions={suggestions}
                            onAddSuggestion={handleAddSuggestion}
                            onUpdateSuggestion={handleUpdateSuggestion}
                            onDeleteSuggestion={handleDeleteSuggestion}
                            setFeedback={showFeedback}
                            userNotifications={userNotifications}
                            onMarkNotificationAsRead={handleMarkNotificationAsRead}
                            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                            onDeleteUserNotification={handleDeleteUserNotification}
                            cart={cart}
                            onAddToCart={handleAddToCart}
                            onQuickBuy={handleQuickBuy}
                            onToggleCart={() => setIsCartOpen(!isCartOpen)}
                            wishlist={wishlist}
                            onToggleWishlist={handleToggleWishlist}
                            onToggleWishlistPanel={() => setIsWishlistOpen(!isWishlistOpen)}
                            onSelectItemDetail={setSelectedItemDetail}
                            onOpenBundleBuilder={() => setIsBundleBuilderOpen(true)}
                       />;
        }
    };

    return (
        <NotificationProvider>
            <div className="pb-20 md:pb-0">
                {renderView()}
            </div>
            {selectedItemDetail && (
                <ProductDetailView
                    item={selectedItemDetail}
                    onClose={() => setSelectedItemDetail(null)}
                    onAddToCart={handleAddToCart}
                    onQuickBuy={handleQuickBuy}
                    wishlist={wishlist}
                    onToggleWishlist={handleToggleWishlist}
                />
            )}
            {isBundleBuilderOpen && (
                <BundleBuilder
                    items={items}
                    onClose={() => setIsBundleBuilderOpen(false)}
                    onAddBundleToCart={handleAddBundleToCart}
                />
            )}
            <Cart 
                isOpen={isCartOpen}
                onClose={() => {
                    setIsCartOpen(false);
                    // Reset cart view to 'cart' when closing, unless it was a success.
                    if (cartView !== 'success') {
                        setCartView('cart');
                    } else if (cart.length > 0) {
                        // If user reopens after success but has items, go to cart view.
                        setCartView('cart');
                    }
                }}
                cart={cart}
                items={items}
                onUpdateQuantity={handleUpdateCartQuantity}
                onOrderSent={handleWhatsAppOrderSent}
                setFeedback={showFeedback}
                view={cartView}
                onViewChange={setCartView}
                discounts={discounts}
                appliedDiscountCode={appliedDiscountCode}
                setAppliedDiscountCode={setAppliedDiscountCode}
                bundleDiscount={bundleDiscount}
            />
            <Wishlist
                isOpen={isWishlistOpen}
                onClose={() => setIsWishlistOpen(false)}
                wishlist={wishlist}
                items={items}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
            />
            <MoreMenuModal
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                onNavigate={setActiveView}
            />
             {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex justify-around z-40">
                {mobileNavItems.map(item => {
                    const isActive = activeView === item.id;
                    const Icon = item.icon;
                    return (
                         <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'more') {
                                    setIsMoreMenuOpen(true);
                                } else {
                                    setActiveView(item.id as View)
                                }
                            }}
                            aria-label={item.label}
                            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-colors duration-200 ${
                                isActive ? 'text-cyan-500' : 'text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400'
                            }`}
                        >
                            <Icon className="h-6 w-6 mb-1" />
                            <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
                        </button>
                    )
                })}
            </nav>
        </NotificationProvider>
    );
}

export default App;