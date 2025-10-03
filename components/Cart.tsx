import React, { useState, useMemo, useEffect } from 'react';
import { Item, FeedbackMessage, Discount } from '../types';
import { XIcon, TrashIcon, PlusIcon, MinusIcon, ShoppingCartIcon, CheckCircleIcon, PaperAirplaneIcon, TicketIcon } from './Icons';
import Tooltip from './Tooltip';

type CartItem = { itemId: number; quantity: number };

interface CartItemDetails extends Item {
    quantity: number;
}

interface CartProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    items: Item[];
    onUpdateQuantity: (itemId: number, quantity: number) => void;
    onOrderSent: () => void;
    setFeedback: (feedback: FeedbackMessage | null) => void;
    view: 'cart' | 'checkout' | 'success';
    onViewChange: (view: 'cart' | 'checkout' | 'success') => void;
    discounts: Discount[];
    appliedDiscountCode: string | null;
    setAppliedDiscountCode: (code: string | null) => void;
    bundleDiscount: number;
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


const Cart: React.FC<CartProps> = ({ isOpen, onClose, cart, items, onUpdateQuantity, onOrderSent, setFeedback, view, onViewChange, discounts, appliedDiscountCode, setAppliedDiscountCode, bundleDiscount }) => {
    const [customerDetails, setCustomerDetails] = useState({ name: '', email: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [discountCodeInput, setDiscountCodeInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (view === 'success' && cart.length === 0) {
                 // stay on success view
            } else if (cart.length === 0 && view !== 'success') {
                onViewChange('cart');
            }
        }
    }, [isOpen, cart.length, view, onViewChange]);

    const cartItems: CartItemDetails[] = useMemo(() => {
        return cart
            .map(cartItem => {
                const itemDetails = items.find(item => item.id === cartItem.itemId);
                return itemDetails ? { ...itemDetails, quantity: cartItem.quantity } : null;
            })
            .filter((item): item is CartItemDetails => item !== null);
    }, [cart, items]);

    const { subtotal, discountAmount, totalPrice, appliedDiscount } = useMemo(() => {
        const sub = cartItems.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0);
        let couponDiscount = 0;
        let finalDiscount: Discount | null = null;
    
        if (appliedDiscountCode && bundleDiscount === 0) { // Coupon is ignored if bundle discount is active
            const discount = discounts.find(d => d.code.toLowerCase() === appliedDiscountCode.toLowerCase());
            if (discount && discount.isActive && sub >= discount.minPurchase) {
                finalDiscount = discount;
                if (discount.type === 'percentage') {
                    couponDiscount = Math.floor(sub * (discount.value / 100));
                } else { // fixed
                    couponDiscount = discount.value;
                }
            }
        }
    
        const totalDiscount = couponDiscount + bundleDiscount;
        const total = sub - totalDiscount;
        return { subtotal: sub, discountAmount: totalDiscount, totalPrice: total > 0 ? total : 0, appliedDiscount: finalDiscount };
    }, [cartItems, appliedDiscountCode, discounts, bundleDiscount]);

    const handleApplyDiscount = () => {
        if (!discountCodeInput.trim()) {
            setFeedback({ type: 'error', message: 'Silakan masukkan kode diskon.' });
            return;
        }
        
        const codeToApply = discountCodeInput.trim().toLowerCase();
        const discount = discounts.find(d => d.code.toLowerCase() === codeToApply);

        if (!discount) {
            setFeedback({ type: 'error', message: 'Kode diskon tidak valid.' });
            setAppliedDiscountCode(null);
            return;
        }
        if (!discount.isActive) {
            setFeedback({ type: 'error', message: 'Kode diskon sudah tidak aktif.' });
            setAppliedDiscountCode(null);
            return;
        }
        if (subtotal < discount.minPurchase) {
            setFeedback({ type: 'error', message: `Minimum pembelian Rp ${discount.minPurchase.toLocaleString('id-ID')} untuk kode ini.` });
            setAppliedDiscountCode(null);
            return;
        }

        setAppliedDiscountCode(discount.code);
        setFeedback({ type: 'success', message: `Kode "${discount.code}" berhasil diterapkan!` });
    };

    const handleRemoveDiscount = () => {
        setAppliedDiscountCode(null);
        setDiscountCodeInput('');
        setFeedback({ type: 'info' as any, message: 'Kode diskon dihapus.' });
    };


    const handleCheckoutSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerDetails.name.trim() || !customerDetails.email.trim()) {
            setFeedback({ type: 'error', message: 'Nama dan email harus diisi.' });
            return;
        }

        setIsProcessing(true);
        const adminWhatsApp = "6285779462118";

        let orderDetails = cartItems.map(item => 
            `- *${item.name}* (x${item.quantity}) - Rp ${ (parsePrice(item.price) * item.quantity).toLocaleString('id-ID')}`
        ).join('\n');

        let summary = `\n\nSubtotal: Rp ${subtotal.toLocaleString('id-ID')}`;
        if (bundleDiscount > 0) {
            summary += `\nDiskon Paket: - Rp ${bundleDiscount.toLocaleString('id-ID')}`;
        }
        if (appliedDiscount) {
            summary += `\nDiskon (${appliedDiscount.code}): - Rp ${discountAmount.toLocaleString('id-ID')}`;
        }
        summary += `\n*Total: Rp ${totalPrice.toLocaleString('id-ID')}*`;

        const message = encodeURIComponent(
`Halo Futo Premium, saya mau pesan:

Detail Pemesan:
Nama: ${customerDetails.name}
Email: ${customerDetails.email}

Pesanan:
${orderDetails}
${summary}

Mohon konfirmasi ketersediaan dan instruksi selanjutnya. Terima kasih!`
        );

        window.open(`https://wa.me/${adminWhatsApp}?text=${message}`, '_blank');
        
        onOrderSent(); // This clears the cart and shows feedback
        setIsProcessing(false);
    };


    const handleCloseAndReset = () => {
        onClose();
        // Delay resetting view to avoid flicker during closing animation
        setTimeout(() => {
            // Always reset to cart view when closed, unless it was a fresh success
            if(view !== 'success' || cart.length > 0) {
                onViewChange('cart');
            }
        }, 300);
    };

    const renderCartView = () => (
        <>
            <div className="p-4 flex-grow overflow-y-auto">
                {cartItems.length > 0 ? (
                    <div className="space-y-4">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                                <img src={item.icon || `https://via.placeholder.com/150/020617/FFFFFF?text=${item.groupName.charAt(0)}`} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-200" />
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Rp {parsePrice(item.price).toLocaleString('id-ID')}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full border dark:border-gray-600"><MinusIcon className="h-4 w-4"/></button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full border dark:border-gray-600"><PlusIcon className="h-4 w-4"/></button>
                                    </div>
                                </div>
                                <button onClick={() => onUpdateQuantity(item.id, 0)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <TrashIcon className="h-5 w-5 text-red-500"/>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <ShoppingCartIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <p className="mt-4 text-gray-500">Keranjang Anda kosong.</p>
                    </div>
                )}
            </div>
            {cartItems.length > 0 && (
                <footer className="p-4 border-t dark:border-gray-700 space-y-3">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-md">
                            <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                            <span className="font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {bundleDiscount > 0 && (
                             <div className="flex justify-between items-center text-md text-green-600 dark:text-green-400">
                                <span>Diskon Paket</span>
                                <span className="font-semibold">- Rp {bundleDiscount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {appliedDiscount ? (
                            <div className="flex justify-between items-center text-md">
                                <button onClick={handleRemoveDiscount} className="text-red-500 text-sm flex items-center gap-1 hover:underline">
                                    <XIcon className="h-4 w-4"/>
                                    <span>Diskon ({appliedDiscount.code})</span>
                                </button>
                                <span className="font-semibold text-green-600 dark:text-green-400">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Tooltip text={bundleDiscount > 0 ? "Kode kupon tidak bisa digabung dengan diskon paket." : ""}>
                                    <input
                                        type="text"
                                        placeholder="Masukkan kode diskon"
                                        value={discountCodeInput}
                                        onChange={(e) => setDiscountCodeInput(e.target.value)}
                                        disabled={bundleDiscount > 0}
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm disabled:bg-gray-200 disabled:dark:bg-gray-800 disabled:cursor-not-allowed"
                                    />
                                </Tooltip>
                                <button onClick={handleApplyDiscount} disabled={bundleDiscount > 0} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:bg-gray-200 disabled:dark:bg-gray-800 disabled:cursor-not-allowed">
                                    Pakai
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t dark:border-gray-600">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-2xl font-bold text-cyan-500">Rp {totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                    <button onClick={() => onViewChange('checkout')} className="w-full bg-cyan-500 text-white font-bold py-3 rounded-lg hover:bg-cyan-600 transition-colors">
                        Lanjut ke Checkout
                    </button>
                </footer>
            )}
        </>
    );

     const renderCheckoutView = () => (
        <>
            <div className="p-4 flex-grow overflow-y-auto">
                <h3 className="font-bold text-lg mb-4">Detail Pemesan</h3>
                <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm">Nama Lengkap</label>
                        <input type="text" value={customerDetails.name} onChange={e => setCustomerDetails(p => ({...p, name: e.target.value}))} required className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="text-sm">Email</label>
                        <input type="email" value={customerDetails.email} onChange={e => setCustomerDetails(p => ({...p, email: e.target.value}))} required className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600" placeholder="e.g. user@example.com" />
                    </div>
                </form>

                 <div className="mt-6 pt-4 border-t dark:border-gray-700">
                    <h4 className="font-semibold mb-2">Ringkasan Pesanan</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {bundleDiscount > 0 && (
                             <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>Diskon Paket</span>
                                <span>- Rp {bundleDiscount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                         {appliedDiscount && (
                            <div className="flex justify-between">
                                <span className="text-green-600 dark:text-green-400">Diskon ({appliedDiscount.code})</span>
                                <span className="text-green-600 dark:text-green-400">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                         <div className="flex justify-between font-bold pt-2 border-t dark:border-gray-600 mt-2">
                            <span>Total</span>
                            <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t dark:border-gray-700">
                    <p className="text-xs text-center text-gray-500 mt-3">
                        Dengan menekan tombol di bawah, Anda akan diarahkan ke WhatsApp untuk mengirim detail pesanan Anda ke admin kami.
                    </p>
                </div>
            </div>
            <footer className="p-4 border-t dark:border-gray-700 grid grid-cols-2 gap-3">
                 <button onClick={() => onViewChange('cart')} className="w-full bg-gray-200 dark:bg-gray-600 text-black dark:text-white font-bold py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    Kembali
                </button>
                <button type="submit" form="checkout-form" disabled={isProcessing} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center gap-2">
                    <PaperAirplaneIcon className="h-5 w-5"/>
                    {isProcessing ? 'Memproses...' : 'Kirim via WhatsApp'}
                </button>
            </footer>
        </>
    );

    const renderSuccessView = () => (
        <div className="p-4 flex-grow flex flex-col items-center justify-center text-center">
            <CheckCircleIcon className="h-24 w-24 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold">Pesanan Siap Dikirim!</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">Tab baru WhatsApp telah terbuka. Silakan kirim pesan yang sudah disiapkan untuk menyelesaikan pesanan Anda.</p>
            <button onClick={handleCloseAndReset} className="w-full max-w-xs bg-cyan-500 text-white font-bold py-3 rounded-lg hover:bg-cyan-600 transition-colors">
                Tutup
            </button>
        </div>
    );


    return (
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCloseAndReset}></div>
            <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingCartIcon className="h-6 w-6 text-cyan-500" />
                        {view === 'cart' && 'Keranjang Belanja'}
                        {view === 'checkout' && 'Checkout'}
                        {view === 'success' && 'Selesai'}
                    </h2>
                    <Tooltip text="Tutup">
                        <button onClick={handleCloseAndReset} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </Tooltip>
                </header>
                
                {view === 'cart' && renderCartView()}
                {view === 'checkout' && renderCheckoutView()}
                {view === 'success' && renderSuccessView()}
            </div>
        </div>
    );
};

export default Cart;