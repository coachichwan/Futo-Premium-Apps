import React, { useState, useMemo, useEffect } from 'react';
import { Item, FeedbackMessage } from '../types';
import { XIcon, TrashIcon, PlusIcon, MinusIcon, ShoppingCartIcon, CheckCircleIcon, QrisIcon, GopayIcon, OvoIcon, VirtualAccountIcon, CreditCardIcon } from './Icons';
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
    onCheckout: (cartItems: CartItem[], customerDetails: { name: string; whatsapp: string }) => boolean;
    setFeedback: (feedback: FeedbackMessage | null) => void;
    view: 'cart' | 'checkout' | 'success';
    onViewChange: (view: 'cart' | 'checkout' | 'success') => void;
}

// ===================================================================================
// !! PERINGATAN KEAMANAN !!
// Kunci server tidak boleh diekspos di sisi klien dalam aplikasi produksi.
// Ini hanya untuk tujuan demonstrasi dalam lingkungan sandbox frontend-only.
// Dalam aplikasi nyata, panggilan untuk membuat token transaksi HARUS dilakukan di backend.
// ===================================================================================
const MIDTRANS_SERVER_KEY_SANDBOX = 'SB-Mid-server-Tropss2uA5p-sW4_';
const MIDTRANS_API_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';


const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    const numericString = priceStr.replace(/[^0-9]/g, '');
    let value = parseInt(numericString, 10);
    if (priceStr.toLowerCase().includes('k')) {
        value *= 1000;
    }
    return isNaN(value) ? 0 : value;
};

const PaymentMethodIcon: React.FC<{icon: React.FC<any>, label: string}> = ({ icon: Icon, label }) => (
    <div className="flex flex-col items-center gap-1 text-center">
        <div className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600">
            <Icon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
);

const Cart: React.FC<CartProps> = ({ isOpen, onClose, cart, items, onUpdateQuantity, onCheckout, setFeedback, view, onViewChange }) => {
    const [customerDetails, setCustomerDetails] = useState({ name: '', whatsapp: '' });
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (view === 'success' && cart.length === 0) {
                 // stay on success view even if cart is now empty
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

    const totalPrice = useMemo(() => {
        return cartItems.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0);
    }, [cartItems]);

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerDetails.name.trim() || !customerDetails.whatsapp.trim()) {
            setFeedback({ type: 'error', message: 'Nama dan nomor WhatsApp harus diisi.' });
            return;
        }

        setIsProcessingPayment(true);

        const transactionPayload = {
            transaction_details: {
                order_id: `FUTO-${Date.now()}`,
                gross_amount: totalPrice,
            },
            item_details: cartItems.map(item => ({
                id: item.id.toString(),
                price: parsePrice(item.price),
                quantity: item.quantity,
                name: item.name,
            })),
            customer_details: {
                first_name: customerDetails.name,
                phone: customerDetails.whatsapp,
            },
        };

        try {
            const response = await fetch(MIDTRANS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': 'Basic ' + btoa(MIDTRANS_SERVER_KEY_SANDBOX + ':'),
                },
                body: JSON.stringify(transactionPayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gagal membuat transaksi Midtrans: ${errorData.error_messages.join(', ')}`);
            }

            const { token } = await response.json();

            window.snap.pay(token, {
                onSuccess: (result) => {
                    console.log('Payment successful:', result);
                    const success = onCheckout(cart, customerDetails);
                    if (success) {
                        onViewChange('success');
                    } else {
                        // Stock check failed even after payment, needs manual handling
                        setFeedback({ type: 'error', message: 'Pembayaran berhasil, tetapi terjadi masalah stok. Hubungi admin.' });
                    }
                    setIsProcessingPayment(false);
                },
                onPending: (result) => {
                    console.log('Payment pending:', result);
                    setFeedback({ type: 'success', message: 'Pembayaran Anda sedang diproses.' });
                    setIsProcessingPayment(false);
                    onClose();
                },
                onError: (result) => {
                    console.error('Payment error:', result);
                    setFeedback({ type: 'error', message: 'Pembayaran gagal. Silakan coba lagi.' });
                    setIsProcessingPayment(false);
                },
                onClose: () => {
                    if (!isProcessingPayment) { // Only show if not followed by another callback
                      setFeedback({ type: 'error', message: 'Anda menutup popup pembayaran.' });
                    }
                    setIsProcessingPayment(false);
                },
            });

        } catch (error) {
            console.error('Error during Midtrans checkout:', error);
            setFeedback({ type: 'error', message: (error as Error).message || 'Gagal terhubung ke gateway pembayaran.' });
            setIsProcessingPayment(false);
        }
    };


    const handleCloseAndReset = () => {
        onClose();
        // Delay resetting view to avoid flicker during closing animation
        setTimeout(() => {
            if (view !== 'success') {
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
                <footer className="p-4 border-t dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold">Total</span>
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
                <h3 className="font-bold text-lg mb-4">Detail Pelanggan</h3>
                <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm">Nama Lengkap</label>
                        <input type="text" value={customerDetails.name} onChange={e => setCustomerDetails(p => ({...p, name: e.target.value}))} required className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="text-sm">Nomor WhatsApp</label>
                        <input type="text" value={customerDetails.whatsapp} onChange={e => setCustomerDetails(p => ({...p, whatsapp: e.target.value}))} required className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600" placeholder="e.g. 628123456789" />
                    </div>
                </form>

                 <div className="mt-6 pt-4 border-t dark:border-gray-700">
                    <h4 className="font-semibold mb-2">Ringkasan Pesanan</h4>
                    <div className="space-y-1 text-sm">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">{item.name} x{item.quantity}</span>
                                <span>Rp {(parsePrice(item.price) * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                        ))}
                         <div className="flex justify-between font-bold pt-2 border-t dark:border-gray-600 mt-2">
                            <span>Total</span>
                            <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t dark:border-gray-700">
                    <h4 className="font-semibold mb-3">Metode Pembayaran</h4>
                    <div className="grid grid-cols-5 gap-2">
                        <PaymentMethodIcon icon={QrisIcon} label="QRIS" />
                        <PaymentMethodIcon icon={GopayIcon} label="GoPay" />
                        <PaymentMethodIcon icon={OvoIcon} label="OVO" />
                        <PaymentMethodIcon icon={VirtualAccountIcon} label="VA" />
                        <PaymentMethodIcon icon={CreditCardIcon} label="Kartu" />
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-3">
                        Pembayaran aman dan terenkripsi diproses melalui Midtrans.
                    </p>
                </div>
            </div>
            <footer className="p-4 border-t dark:border-gray-700 grid grid-cols-2 gap-3">
                 <button onClick={() => onViewChange('cart')} className="w-full bg-gray-200 dark:bg-gray-600 text-black dark:text-white font-bold py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    Kembali
                </button>
                <button type="submit" form="checkout-form" disabled={isProcessingPayment} className="w-full bg-cyan-500 text-white font-bold py-3 rounded-lg hover:bg-cyan-600 transition-colors disabled:bg-gray-400 disabled:cursor-wait">
                    {isProcessingPayment ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
            </footer>
        </>
    );

    const renderSuccessView = () => (
        <div className="p-4 flex-grow flex flex-col items-center justify-center text-center">
            <CheckCircleIcon className="h-24 w-24 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold">Pembayaran Berhasil!</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">Terima kasih telah berbelanja. Pesanan Anda sedang diproses.</p>
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
