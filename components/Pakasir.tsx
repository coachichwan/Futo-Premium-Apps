import React, { useState, useMemo } from 'react';
import { Item, PakasirOrder, PaymentMethod, PaymentStatus, Discount, Reseller } from '../types';
import QRISPayment from './QRISPayment';

interface PakasirProps {
  items: Item[];
  discounts: Discount[];
  resellers: Reseller[];
  orders: PakasirOrder[];
  onCreateOrder: (order: PakasirOrder) => void;
  onUpdateOrderStatus: (orderId: string, status: PaymentStatus) => void;
  onUpdateStock: (itemId: number, quantity: number) => void;
}

interface CartItem {
  item: Item;
  quantity: number;
}

const Pakasir: React.FC<PakasirProps> = ({
  items,
  discounts,
  resellers,
  orders,
  onCreateOrder,
  onUpdateOrderStatus,
  onUpdateStock,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [selectedReseller, setSelectedReseller] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [showQRIS, setShowQRIS] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<PakasirOrder | null>(null);

  const availableItems = items.filter(item => item.isVisibleInStore && item.currentStock > 0);
  
  const categories = useMemo(() => {
    const cats = new Set(availableItems.map(item => item.category));
    return ['Semua', ...Array.from(cats)];
  }, [availableItems]);

  const filteredItems = useMemo(() => {
    return availableItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.groupName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [availableItems, searchTerm, selectedCategory]);

  const parsePrice = (price: string): number => {
    const cleaned = price.replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
  };

  const subtotal = cart.reduce((sum, cartItem) => {
    return sum + (parsePrice(cartItem.item.price) * cartItem.quantity);
  }, 0);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (subtotal < appliedDiscount.minPurchase) return 0;
    
    if (appliedDiscount.type === 'percentage') {
      return Math.floor(subtotal * appliedDiscount.value / 100);
    } else {
      return appliedDiscount.value;
    }
  }, [subtotal, appliedDiscount]);

  const total = subtotal - discountAmount;

  const addToCart = (item: Item) => {
    const existingItem = cart.find(ci => ci.item.id === item.id);
    if (existingItem) {
      if (existingItem.quantity < item.currentStock) {
        setCart(cart.map(ci => 
          ci.item.id === item.id 
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        ));
      }
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(ci => ci.item.id !== itemId));
    } else {
      const item = items.find(i => i.id === itemId);
      if (item && quantity <= item.currentStock) {
        setCart(cart.map(ci =>
          ci.item.id === itemId ? { ...ci, quantity } : ci
        ));
      }
    }
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(ci => ci.item.id !== itemId));
  };

  const applyDiscount = () => {
    const discount = discounts.find(d => 
      d.code.toUpperCase() === discountCode.toUpperCase() && d.isActive
    );
    if (discount) {
      setAppliedDiscount(discount);
    } else {
      alert('Kode diskon tidak valid!');
    }
  };

  const clearCart = () => {
    setCart([]);
    setDiscountCode('');
    setAppliedDiscount(null);
    setSelectedReseller(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setNotes('');
    setPaymentMethod(PaymentMethod.CASH);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    if (!customerName.trim()) {
      alert('Nama pelanggan harus diisi!');
      return;
    }

    const order: PakasirOrder = {
      id: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      items: cart.map(ci => ({
        itemId: ci.item.id,
        itemName: ci.item.name,
        quantity: ci.quantity,
        price: parsePrice(ci.item.price),
        subtotal: parsePrice(ci.item.price) * ci.quantity,
      })),
      subtotal,
      discount: discountAmount,
      discountCode: appliedDiscount?.code,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === PaymentMethod.QRIS ? PaymentStatus.PENDING : PaymentStatus.PAID,
      resellerId: selectedReseller || undefined,
      resellerName: resellers.find(r => r.id === selectedReseller)?.name,
      customerName,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      completedAt: paymentMethod !== PaymentMethod.QRIS ? new Date().toISOString() : undefined,
    };

    if (paymentMethod === PaymentMethod.QRIS) {
      setCurrentOrder(order);
      setShowQRIS(true);
    } else {
      cart.forEach(ci => {
        onUpdateStock(ci.item.id, ci.item.currentStock - ci.quantity);
      });
      onCreateOrder(order);
      clearCart();
      alert('Pesanan berhasil dibuat!');
    }
  };

  const handleQRISComplete = (qrisPayment: any) => {
    if (currentOrder) {
      const completedOrder: PakasirOrder = {
        ...currentOrder,
        paymentStatus: PaymentStatus.PAID,
        completedAt: new Date().toISOString(),
        qrisPayment,
      };
      
      cart.forEach(ci => {
        onUpdateStock(ci.item.id, ci.item.currentStock - ci.quantity);
      });
      
      onCreateOrder(completedOrder);
      setShowQRIS(false);
      setCurrentOrder(null);
      clearCart();
      alert('Pembayaran QRIS berhasil!');
    }
  };

  const handleQRISCancel = () => {
    setShowQRIS(false);
    setCurrentOrder(null);
  };

  if (showQRIS && currentOrder) {
    return (
      <QRISPayment
        orderId={currentOrder.id}
        amount={currentOrder.total}
        customerName={currentOrder.customerName || ''}
        onComplete={handleQRISComplete}
        onCancel={handleQRISCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💰 Pakasir - Sistem Kasir Digital</h1>
          <p className="text-gray-600">Sistem kasir untuk penjualan lisensi & produk digital</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-500"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{item.groupName}</h3>
                      <span className="text-lg font-bold text-blue-600">{item.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{item.planName}</p>
                    <p className="text-xs text-gray-500">Stok: {item.currentStock}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🛒 Keranjang</h2>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Keranjang masih kosong</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.map(ci => (
                    <div key={ci.item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-800">{ci.item.groupName}</h4>
                          <p className="text-xs text-gray-600">{ci.item.planName}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(ci.item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                            className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{ci.quantity}</span>
                          <button
                            onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                            className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-semibold text-blue-600">
                          Rp {(parsePrice(ci.item.price) * ci.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Nama Pelanggan *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama pelanggan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">No. WhatsApp</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08xxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Reseller</label>
                  <select
                    value={selectedReseller || ''}
                    onChange={(e) => setSelectedReseller(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Reseller (Opsional)</option>
                    {resellers.filter(r => r.status === 'active').map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.commissionRate}%)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Kode Diskon</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="Kode diskon"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={applyDiscount}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Terapkan
                    </button>
                  </div>
                  {appliedDiscount && (
                    <p className="text-xs text-green-600">✓ Diskon diterapkan: {appliedDiscount.code}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={PaymentMethod.CASH}>💵 Tunai</option>
                    <option value={PaymentMethod.QRIS}>📱 QRIS</option>
                    <option value={PaymentMethod.TRANSFER}>🏦 Transfer Bank</option>
                    <option value={PaymentMethod.WHATSAPP}>💬 WhatsApp</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Diskon:</span>
                      <span className="font-medium text-green-600">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span className="text-blue-600">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {paymentMethod === PaymentMethod.QRIS ? '📱 Bayar dengan QRIS' : '✓ Proses Pesanan'}
                </button>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="w-full py-2 bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pakasir;
