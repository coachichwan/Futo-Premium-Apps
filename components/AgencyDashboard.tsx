import React, { useMemo } from 'react';
import { PakasirOrder, Reseller, PaymentStatus, PaymentMethod, Item } from '../types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AgencyDashboardProps {
  orders: PakasirOrder[];
  resellers: Reseller[];
  items: Item[];
}

const AgencyDashboard: React.FC<AgencyDashboardProps> = ({ orders, resellers, items }) => {
  const stats = useMemo(() => {
    const paidOrders = orders.filter(o => o.paymentStatus === PaymentStatus.PAID);
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = paidOrders.filter(o => new Date(o.createdAt) >= today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthOrders = paidOrders.filter(o => new Date(o.createdAt) >= thisMonth);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);

    const activeResellers = resellers.filter(r => r.status === 'active').length;
    
    const totalCommission = paidOrders
      .filter(o => o.resellerId)
      .reduce((sum, o) => {
        const reseller = resellers.find(r => r.id === o.resellerId);
        if (reseller) {
          return sum + (o.total * reseller.commissionRate / 100);
        }
        return sum;
      }, 0);

    return {
      totalRevenue,
      totalOrders: paidOrders.length,
      todayRevenue,
      todayOrders: todayOrders.length,
      monthRevenue,
      monthOrders: monthOrders.length,
      activeResellers,
      totalCommission,
      pendingOrders: orders.filter(o => o.paymentStatus === PaymentStatus.PENDING).length,
      avgOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
    };
  }, [orders, resellers]);

  const salesByDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last7Days.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= date && orderDate < nextDay && o.paymentStatus === PaymentStatus.PAID;
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0);

      return {
        date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        revenue: dayRevenue,
        orders: dayOrders.length,
      };
    });
  }, [orders]);

  const salesByPaymentMethod = useMemo(() => {
    const paidOrders = orders.filter(o => o.paymentStatus === PaymentStatus.PAID);
    const methods = [
      PaymentMethod.CASH,
      PaymentMethod.QRIS,
      PaymentMethod.TRANSFER,
      PaymentMethod.WHATSAPP,
    ];

    return methods.map(method => {
      const methodOrders = paidOrders.filter(o => o.paymentMethod === method);
      const revenue = methodOrders.reduce((sum, o) => sum + o.total, 0);
      
      return {
        name: method,
        value: revenue,
        count: methodOrders.length,
      };
    }).filter(m => m.value > 0);
  }, [orders]);

  const topResellers = useMemo(() => {
    const resellerStats = resellers
      .filter(r => r.status === 'active')
      .map(reseller => {
        const resellerOrders = orders.filter(o => 
          o.resellerId === reseller.id && o.paymentStatus === PaymentStatus.PAID
        );
        const revenue = resellerOrders.reduce((sum, o) => sum + o.total, 0);
        const commission = revenue * reseller.commissionRate / 100;

        return {
          name: reseller.name,
          orders: resellerOrders.length,
          revenue,
          commission,
          commissionRate: reseller.commissionRate,
        };
      })
      .filter(r => r.orders > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return resellerStats;
  }, [orders, resellers]);

  const topProducts = useMemo(() => {
    const productStats = new Map<number, { name: string; quantity: number; revenue: number }>();

    orders
      .filter(o => o.paymentStatus === PaymentStatus.PAID)
      .forEach(order => {
        order.items.forEach(item => {
          const existing = productStats.get(item.itemId);
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += item.subtotal;
          } else {
            productStats.set(item.itemId, {
              name: item.itemName,
              quantity: item.quantity,
              revenue: item.subtotal,
            });
          }
        });
      });

    return Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">📊 Dashboard Keagenan</h1>
        <p className="text-blue-100">Pantau performa penjualan lisensi & produk digital Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Total Pendapatan</p>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            Rp {(stats.totalRevenue / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-gray-500 mt-2">{stats.totalOrders} pesanan</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Hari Ini</p>
            <span className="text-3xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            Rp {(stats.todayRevenue / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-gray-500 mt-2">{stats.todayOrders} pesanan</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Bulan Ini</p>
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            Rp {(stats.monthRevenue / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-gray-500 mt-2">{stats.monthOrders} pesanan</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Reseller Aktif</p>
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.activeResellers}</p>
          <p className="text-xs text-gray-500 mt-2">Total komisi: Rp {(stats.totalCommission / 1000).toFixed(0)}k</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-1">📈 Statistik Cepat</h3>
          <p className="text-sm text-gray-600 mb-4">Ringkasan performa</p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">Rata-rata Nilai Pesanan</p>
              <p className="text-2xl font-bold text-gray-800">
                Rp {(stats.avgOrderValue / 1000).toFixed(0)}k
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-sm text-gray-600">Pesanan Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600">Produk Tersedia</p>
              <p className="text-2xl font-bold text-gray-800">
                {items.filter(i => i.isVisibleInStore && i.currentStock > 0).length}
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <p className="text-sm text-gray-600">Stok Rendah</p>
              <p className="text-2xl font-bold text-red-600">
                {items.filter(i => i.currentStock <= i.minStock && i.currentStock > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Penjualan 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => `Rp ${(value / 1000).toFixed(0)}k`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3B82F6" name="Pendapatan" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Pembayaran per Metode</h3>
          {salesByPaymentMethod.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={salesByPaymentMethod}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesByPaymentMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `Rp ${(value / 1000).toFixed(0)}k`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">Belum ada data</p>
          )}
          <div className="mt-4 space-y-2">
            {salesByPaymentMethod.map((method, idx) => (
              <div key={method.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                  <span className="text-gray-700">{method.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">Rp {(method.value / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-gray-500">{method.count} transaksi</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top 5 Produk</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div key={product.name} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                        {idx + 1}
                      </span>
                      <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Terjual: {product.quantity} unit</span>
                    <span className="font-semibold text-blue-600">Rp {(product.revenue / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">Belum ada data</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">⭐ Top 5 Reseller</h3>
        {topResellers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ranking</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Reseller</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Pesanan</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Penjualan</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Komisi (%)</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Komisi</th>
                </tr>
              </thead>
              <tbody>
                {topResellers.map((reseller, idx) => (
                  <tr key={reseller.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                        idx === 1 ? 'bg-gray-200 text-gray-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{reseller.name}</td>
                    <td className="py-3 px-4 text-center">{reseller.orders}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-800">
                      Rp {(reseller.revenue / 1000).toFixed(0)}k
                    </td>
                    <td className="py-3 px-4 text-center text-blue-600 font-medium">
                      {reseller.commissionRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">
                      Rp {(reseller.commission / 1000).toFixed(0)}k
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">Belum ada data reseller</p>
        )}
      </div>
    </div>
  );
};

export default AgencyDashboard;
