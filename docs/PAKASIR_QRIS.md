# 💰 Pakasir & QRIS - Sistem Keagenan Digital

## Overview
Sistem Pakasir (Point of Sale) lengkap untuk mengelola penjualan lisensi dan produk digital dengan dukungan pembayaran QRIS, cash, transfer bank, dan WhatsApp.

## Fitur Utama

### 1. 💰 Pakasir (Cashier/POS)
Interface kasir profesional untuk memproses penjualan dengan fitur:
- **Product Selection**: Browse dan cari produk dengan filter kategori
- **Cart Management**: Tambah, kurangi, dan hapus item dari keranjang
- **Customer Information**: Input nama, nomor WhatsApp, dan email pelanggan
- **Reseller Assignment**: Assign transaksi ke reseller untuk tracking komisi
- **Discount System**: Apply kode diskon untuk potongan harga
- **Multiple Payment Methods**: 
  - 💵 Tunai (Cash)
  - 📱 QRIS (Quick Response Indonesian Standard)
  - 🏦 Transfer Bank
  - 💬 WhatsApp
- **Real-time Stock Check**: Validasi stok sebelum checkout
- **Auto Stock Deduction**: Otomatis mengurangi stok setelah pembayaran

### 2. 📱 QRIS Payment
Sistem pembayaran QRIS terintegrasi dengan:
- **QR Code Generation**: Generate QR code untuk pembayaran
- **Payment Timer**: Countdown 5 menit untuk menyelesaikan pembayaran
- **Payment Status Tracking**: 
  - ⏳ Pending
  - ✅ Paid
  - ❌ Cancelled
  - ⏰ Expired
- **Payment Confirmation**: Manual confirmation setelah scan QR
- **Payment Receipt**: Detail transaksi lengkap dengan QR code
- **Multi-bank Support**: Kompatibel dengan semua bank dan e-wallet Indonesia

### 3. 📊 Dashboard Keagenan
Dashboard komprehensif untuk monitoring performa:
- **Revenue Metrics**: 
  - Total pendapatan
  - Pendapatan hari ini
  - Pendapatan bulan ini
  - Rata-rata nilai pesanan
- **Order Statistics**:
  - Total pesanan
  - Pesanan hari ini
  - Pesanan bulan ini
  - Pesanan pending
- **Sales Charts**:
  - Grafik penjualan 7 hari terakhir
  - Breakdown pembayaran per metode (Pie chart)
- **Top Performers**:
  - Top 5 produk terlaris
  - Top 5 reseller dengan komisi tertinggi
- **Reseller Metrics**:
  - Total reseller aktif
  - Total komisi yang dibayarkan

### 4. 📋 Riwayat Transaksi Pakasir
History dan reporting lengkap dengan:
- **Transaction List**: Daftar semua transaksi dengan filter
- **Advanced Filtering**:
  - Search by Order ID, customer name, reseller name
  - Filter by payment status (Paid, Pending, Cancelled, Expired)
  - Filter by payment method
- **Transaction Details**:
  - Customer information
  - Order items dengan quantity dan harga
  - Discount applied
  - Payment method dan status
  - Reseller information
  - QRIS payment details
- **Statistics Cards**:
  - Total orders dan revenue
  - Today's orders dan revenue
  - Pending orders count

## Data Structure

### PakasirOrder
```typescript
interface PakasirOrder {
  id: string;
  items: Array<{
    itemId: number;
    itemName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  discountCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  resellerId?: number;
  resellerName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  qrisPayment?: QRISPayment;
}
```

### QRISPayment
```typescript
interface QRISPayment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  qrCode: string; // Base64 QR code image
  merchantName: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
}
```

### Payment Methods
```typescript
enum PaymentMethod {
  CASH = 'CASH',
  QRIS = 'QRIS',
  TRANSFER = 'TRANSFER',
  WHATSAPP = 'WHATSAPP',
}
```

### Payment Status
```typescript
enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}
```

## User Flow

### Flow Transaksi Pakasir

1. **Product Selection**
   - Cashier browse produk atau search
   - Filter by kategori
   - Klik produk untuk add to cart

2. **Cart Management**
   - Review items di keranjang
   - Adjust quantity (+ / -)
   - Remove items jika perlu

3. **Customer Information**
   - Input nama pelanggan (required)
   - Input nomor WhatsApp (optional)
   - Input email (optional)

4. **Discount & Reseller**
   - Apply discount code (optional)
   - Select reseller (optional) untuk tracking komisi

5. **Payment Method Selection**
   - Pilih metode pembayaran:
     - Cash: Langsung selesai
     - QRIS: Redirect ke payment page
     - Transfer: Langsung selesai
     - WhatsApp: Langsung selesai

6. **Checkout**
   - Validasi stok tersedia
   - Create order
   - Deduct stock
   - Show success message

### Flow Pembayaran QRIS

1. **Generate QR Code**
   - System generate QR code QRIS
   - Display QR code dengan timer 5 menit
   - Show payment instructions

2. **Customer Scan**
   - Customer scan QR menggunakan mobile banking/e-wallet
   - Complete payment di app mereka

3. **Payment Confirmation**
   - Cashier klik "Konfirmasi Pembayaran"
   - Order status berubah dari PENDING → PAID
   - Stock otomatis dikurangi
   - Show success message

4. **Handle Expiry**
   - Jika timer habis sebelum konfirmasi
   - Status berubah ke EXPIRED
   - Customer harus create order baru

## Navigation

### Mobile Navigation
1. **Store** - Customer storefront (existing)
2. **Pakasir** - POS interface (NEW)
3. **Stok** - Stock management (existing)
4. **Lainnya** - More menu dengan akses ke:
   - Dashboard Keagenan
   - Riwayat Pakasir
   - Manajemen Reseller
   - Kalkulator Refund
   - Panduan Reseller

## Benefits

### Untuk Pemilik Toko
- Sistem kasir profesional untuk transaksi offline/online
- Tracking lengkap semua penjualan
- Monitor performa penjualan real-time
- Kelola komisi reseller otomatis
- Support multiple payment methods

### Untuk Reseller
- Transparansi komisi
- Tracking penjualan individual
- Ranking system untuk motivasi

### Untuk Customer
- Pembayaran QRIS yang mudah dan familiar
- Receipt digital lengkap
- Multiple payment options

## Integration Points

### With Existing Features
- **Stock Management**: Auto stock deduction after payment
- **Reseller System**: Assign sales to resellers, auto-calculate commission
- **Discount System**: Use existing discount codes in Pakasir
- **Item Catalog**: Fetch products from existing inventory

### Data Persistence
- Orders saved to `localStorage` dengan key `pakasir-orders`
- Survives page refresh
- Export capability untuk backup (future enhancement)

## Future Enhancements

### Short Term
- [ ] Print receipt functionality
- [ ] Export transactions to CSV/Excel
- [ ] Batch QRIS payment reconciliation
- [ ] Push notifications untuk payment success

### Medium Term
- [ ] Real QRIS API integration (Midtrans/DOKU/LinkAja)
- [ ] Automatic QRIS payment status checking
- [ ] Email receipt ke customer
- [ ] WhatsApp receipt automation

### Long Term
- [ ] Multi-terminal support
- [ ] Shift management untuk multiple cashiers
- [ ] Cash drawer tracking
- [ ] Advanced reporting dengan export PDF

## Technical Notes

### Performance
- QR code generation menggunakan HTML5 Canvas
- Optimized rendering dengan useMemo untuk expensive computations
- Efficient filtering dengan memoization

### Security Considerations
- Payment amounts validated before processing
- Stock validation prevents overselling
- Order IDs are unique dengan timestamp + random string

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Touch-optimized interfaces

## Usage Guide

### For Store Owners
1. Navigate ke **Pakasir** dari bottom navigation
2. Select products untuk customer
3. Input customer information
4. Apply discount jika ada
5. Select payment method
6. Process payment

### For Viewing Reports
1. Tap **Lainnya** di bottom navigation
2. Select **Dashboard Keagenan** untuk overview
3. Select **Riwayat Pakasir** untuk transaction details

### For Managing Resellers
1. Tap **Lainnya** di bottom navigation
2. Select **Manajemen Reseller**
3. View top performers di Dashboard Keagenan

## Support

Untuk pertanyaan atau issue terkait Pakasir & QRIS:
- Check dokumentasi ini terlebih dahulu
- Review existing orders di Riwayat Pakasir
- Contact admin via WhatsApp support widget

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Author**: FUTO Digital Team
