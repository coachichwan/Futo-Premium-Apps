import React, { useState, useMemo } from 'react';
import { PakasirOrder, PaymentMethod, PaymentStatus } from '../types';

interface PakasirHistoryProps {
  orders: PakasirOrder[];
}

const PakasirHistory: React.FC<PakasirHistoryProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'ALL'>('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<PaymentMethod | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<PakasirOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.resellerName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || order.paymentStatus === filterStatus;
      const matchesPaymentMethod = filterPaymentMethod === 'ALL' || order.paymentMethod === filterPaymentMethod;
      
      return matchesSearch && matchesStatus && matchesPaymentMethod;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchTerm, filterStatus, filterPaymentMethod]);

  const stats = useMemo(() => {
    const total = orders.reduce((sum, order) => {
      return order.paymentStatus === PaymentStatus.PAID ? sum + order.total : sum;
    }, 0);
    
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
      new Date(order.createdAt).toDateString() === today &&
      order.paymentStatus === PaymentStatus.PAID
    );
    const todayTotal = todayOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      totalOrders: orders.length,
      totalRevenue: total,
      todayOrders: todayOrders.length,
      todayRevenue: todayTotal,
      pendingOrders: orders.filter(o => o.paymentStatus === PaymentStatus.PENDING).length,
    };
  }, [orders]);

  const getStatusBadge = (status: PaymentStatus) => {
    const colors = {
      [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
      [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [PaymentStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [PaymentStatus.EXPIRED]: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      [PaymentStatus.PAID]: 'Lunas',
      [PaymentStatus.PENDING]: 'Pending',
      [PaymentStatus.CANCELLED]: 'Dibatalkan',
      [PaymentStatus.EXPIRED]: 'Kadaluarsa',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    const icons = {
      [PaymentMethod.CASH]: '💵',
      [PaymentMethod.QRIS]: '📱',
      [PaymentMethod.TRANSFER]: '🏦',
      [PaymentMethod.WHATSAPP]: '💬',
    };
    return icons[method];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-blue-100 text-sm mb-1">Total Pesanan</p>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-green-100 text-sm mb-1">Total Pendapatan</p>
          <p className="text-2xl font-bold">Rp {(stats.totalRevenue / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-purple-100 text-sm mb-1">Pesanan Hari Ini</p>
          <p className="text-3xl font-bold">{stats.todayOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-indigo-100 text-sm mb-1">Pendapatan Hari Ini</p>
          <p className="text-2xl font-bold">Rp {(stats.todayRevenue / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-yellow-100 text-sm mb-1">Pesanan Pending</p>
          <p className="text-3xl font-bold">{stats.pendingOrders}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Riwayat Transaksi</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Cari order ID, pelanggan, atau reseller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Semua Status</option>
            <option value={PaymentStatus.PAID}>Lunas</option>
            <option value={PaymentStatus.PENDING}>Pending</option>
            <option value={PaymentStatus.CANCELLED}>Dibatalkan</option>
            <option value={PaymentStatus.EXPIRED}>Kadaluarsa</option>
          </select>

          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value as PaymentMethod | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Semua Metode Pembayaran</option>
            <option value={PaymentMethod.CASH}>💵 Tunai</option>
            <option value={PaymentMethod.QRIS}>📱 QRIS</option>
            <option value={PaymentMethod.TRANSFER}>🏦 Transfer</option>
            <option value={PaymentMethod.WHATSAPP}>💬 WhatsApp</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Pelanggan</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Pembayaran</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs text-gray-600">{order.id}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{order.customerName || '-'}</p>
                      {order.resellerName && (
                        <p className="text-xs text-blue-600">via {order.resellerName}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {order.items.length} item(s)
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-800">
                        Rp {order.total.toLocaleString('id-ID')}
                      </p>
                      {order.discount > 0 && (
                        <p className="text-xs text-green-600">-Rp {order.discount.toLocaleString('id-ID')}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {getPaymentMethodIcon(order.paymentMethod)} {order.paymentMethod}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Detail Pesanan</h3>
                <p className="font-mono text-sm text-gray-600">{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status Pembayaran</p>
                  {getStatusBadge(selectedOrder.paymentStatus)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Metode Pembayaran</p>
                  <p className="font-medium">
                    {getPaymentMethodIcon(selectedOrder.paymentMethod)} {selectedOrder.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tanggal Pesanan</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                {selectedOrder.completedAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tanggal Selesai</p>
                    <p className="font-medium">{formatDate(selectedOrder.completedAt)}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Informasi Pelanggan</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="text-gray-600">Nama:</span> <span className="font-medium">{selectedOrder.customerName || '-'}</span></p>
                  {selectedOrder.customerPhone && (
                    <p><span className="text-gray-600">WhatsApp:</span> <span className="font-medium">{selectedOrder.customerPhone}</span></p>
                  )}
                  {selectedOrder.customerEmail && (
                    <p><span className="text-gray-600">Email:</span> <span className="font-medium">{selectedOrder.customerEmail}</span></p>
                  )}
                  {selectedOrder.resellerName && (
                    <p><span className="text-gray-600">Reseller:</span> <span className="font-medium text-blue-600">{selectedOrder.resellerName}</span></p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Item Pesanan</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Produk</th>
                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Harga</th>
                        <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="py-3 px-4 text-sm">{item.itemName}</td>
                          <td className="py-3 px-4 text-center text-sm">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-sm">Rp {item.price.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-right font-medium">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">Rp {selectedOrder.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">
                      Diskon {selectedOrder.discountCode && `(${selectedOrder.discountCode})`}:
                    </span>
                    <span className="font-medium text-green-600">-Rp {selectedOrder.discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Catatan</h4>
                  <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {selectedOrder.qrisPayment && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Informasi QRIS</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm"><span className="text-gray-600">Payment ID:</span> <span className="font-mono">{selectedOrder.qrisPayment.id}</span></p>
                    <p className="text-sm"><span className="text-gray-600">Merchant:</span> <span className="font-medium">{selectedOrder.qrisPayment.merchantName}</span></p>
                    {selectedOrder.qrisPayment.paidAt && (
                      <p className="text-sm"><span className="text-gray-600">Dibayar:</span> <span className="font-medium">{formatDate(selectedOrder.qrisPayment.paidAt)}</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PakasirHistory;
