<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 💰 Web Keagenan Digital - Pakasir & QRIS

Sistem keagenan lengkap untuk jualan lisensi, produk digital, dan pembayaran QRIS.

## ✨ Fitur Utama

### 🏪 Customer Storefront
- Katalog produk digital dengan search & filter
- Wishlist & notifikasi
- Cart dengan diskon & bundle
- Checkout via WhatsApp
- Detail produk dengan testimonial

### 💰 Pakasir (Point of Sale)
- Interface kasir profesional
- Multi-payment methods (Cash, QRIS, Transfer, WhatsApp)
- Real-time stock validation
- Customer & reseller assignment
- Discount code support
- Auto stock deduction

### 📱 QRIS Payment System
- Generate QR code untuk pembayaran
- Payment timer (5 menit)
- Status tracking (Pending, Paid, Cancelled, Expired)
- Payment confirmation
- Multi-bank & e-wallet support

### 📊 Dashboard Keagenan
- Revenue metrics (total, today, monthly)
- Order statistics
- Sales charts (7 days)
- Payment method breakdown
- Top 5 products
- Top 5 resellers dengan komisi
- Reseller performance tracking

### 📋 Management Tools
- **Stock Management**: Inventory tracking, low stock alerts
- **Reseller Management**: Komisi tracking, invitation system
- **Discount Management**: Coupon codes dengan min. purchase
- **Transaction History**: Complete pakasir order history
- **Reports & Analytics**: Sales, inventory, reseller reports

## 🚀 Quick Start

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open browser ke `http://localhost:5173`

## 📱 Navigation

### Mobile Bottom Navigation
- **Store**: Customer storefront
- **Pakasir**: POS interface untuk kasir
- **Stok**: Stock management dashboard
- **Lainnya**: More menu dengan:
  - Dashboard Keagenan
  - Riwayat Pakasir
  - Manajemen Reseller
  - Kalkulator Refund
  - Panduan Reseller

## 📚 Documentation

- [Pakasir & QRIS Guide](docs/PAKASIR_QRIS.md) - Panduan lengkap sistem pakasir dan QRIS

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind-style utility classes
- **Charts**: Recharts
- **AI Features**: @google/genai (Gemini)
- **Storage**: localStorage (data persistence)
- **Testing**: Jest + React Testing Library

## 🔑 Key Features Detail

### Payment Methods
- 💵 **Cash**: Instant completion
- 📱 **QRIS**: QR code scan & payment
- 🏦 **Transfer**: Manual bank transfer
- 💬 **WhatsApp**: Order via WhatsApp

### Reseller System
- Commission tracking per transaction
- Top reseller leaderboard
- Invitation system
- Performance analytics

### Stock Management
- Real-time stock tracking
- Low stock alerts (configurable)
- CSV import for bulk update
- Transaction history

### Discount System
- Percentage or fixed amount
- Minimum purchase requirement
- Active/inactive status
- Apply at checkout or pakasir

## 📊 Data Structure

All data persists in localStorage:
- `pakasir-orders`: Pakasir transactions
- `stock-items`: Product inventory
- `stock-resellers`: Reseller data
- `stock-discounts`: Discount codes
- `stock-transactions`: Stock movements

## 🎯 Use Cases

### For Store Owners
- Process offline/online sales via pakasir
- Track all revenue & orders
- Monitor reseller performance
- Manage inventory & alerts

### For Resellers
- Transparent commission tracking
- Performance ranking
- Sales history

### For Customers
- Easy QRIS payment
- Multiple payment options
- Digital receipt

## 🔒 Security Notes

- Payment amounts validated before processing
- Stock validation prevents overselling
- Unique order IDs (timestamp + random)
- Local data persistence (no server sync)

## 📈 Future Enhancements

- [ ] Real QRIS API integration (Midtrans/DOKU)
- [ ] Print receipt functionality
- [ ] Export to CSV/Excel
- [ ] Email & WhatsApp receipts
- [ ] Multi-terminal support
- [ ] Shift management
- [ ] Advanced reporting with PDF export

## 📞 Support

View your app in AI Studio: https://ai.studio/apps/drive/1YivcxAYVkkds0KP410bJ3LKukfIVAzst

For questions or issues:
- Check [Pakasir & QRIS Guide](docs/PAKASIR_QRIS.md)
- Review transaction history in Riwayat Pakasir
- Contact admin via WhatsApp support widget

---

**Version**: 1.0.0  
**License**: ISC  
**Author**: FUTO Digital Team
