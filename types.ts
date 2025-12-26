export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
}

export enum AlertConfigType {
    DEFAULT = 'DEFAULT',       // Alert at minStock
    PERCENTAGE = 'PERCENTAGE', // Alert at minStock * (value / 100)
    QUANTITY = 'QUANTITY',     // Alert at specific value
    DISABLED = 'DISABLED',     // No alert
}

export interface AlertConfig {
    type: AlertConfigType;
    value: number; // Represents percentage or quantity based on type
}

export interface Testimonial {
    author: string;
    quote: string;
}

export interface Item {
  id: number;
  name: string; // Full unique name e.g., "Netflix - Private"
  unit: string;
  minStock: number;
  currentStock: number;
  description: string; // Description for the specific plan/item
  alertConfig: AlertConfig;
  icon?: string; // To store base64 data URL for the icon

  // New fields for dynamic product catalog
  category: string; // e.g., "Akun Streaming", "Lisensi Produktivitas"
  groupName: string; // e.g., "Netflix", "Canva Pro". Used for grouping plans into a product card.
  planName: string; // e.g., "Private", "1P1U Request Nama". The name of the plan itself.
  price: string; // e.g., "120k"
  warranty: string;
  features: string[];
  isVisibleInStore: boolean;
  orderLink?: string; // Base order link for the product group
  testimonials?: Testimonial[]; // For product detail view
}


export interface Transaction {
  id: number;
  itemId: number;
  type: TransactionType;
  quantity: number;
  date: string;
  description: string;
  resellerId?: number; // Link to the reseller who made the sale
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  itemId?: number;
}

export interface FeedbackMessage {
  type: 'success' | 'error';
  message: string;
}

export interface Suggestion {
  id: number;
  title: string;
  description: string;
}

export interface UserNotification {
  id: number;
  message: string;
  date: string; // ISO string
  read: boolean;
}

export enum StockLevelStatus {
    CRITICAL = 'CRITICAL', // Stock is 0
    LOW = 'LOW',           // Stock is > 0 but <= minStock
    WARNING = 'WARNING',   // Stock is > minStock but <= minStock * 1.25
    NORMAL = 'NORMAL',
}

export interface Reseller {
    id: number;
    name: string;
    whatsappNumber: string;
    joinDate: string; // ISO string
    commissionRate: number; // Commission percentage, e.g., 10 for 10%
    status: 'active' | 'pending';
    email?: string;
    inviteCode?: string;
}

export interface Discount {
  id: string; 
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number; // Minimum purchase amount in currency
  isActive: boolean;
}

export enum PaymentMethod {
  CASH = 'CASH',
  QRIS = 'QRIS',
  TRANSFER = 'TRANSFER',
  WHATSAPP = 'WHATSAPP',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface QRISPayment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  qrCode: string; // Base64 QR code image or URL
  merchantName: string;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
  paidAt?: string; // ISO string
}

export interface PakasirOrder {
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
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  qrisPayment?: QRISPayment;
}

export interface AgencyStats {
  totalSales: number;
  totalOrders: number;
  totalCommission: number;
  activeResellers: number;
  todaySales: number;
  todayOrders: number;
  monthSales: number;
  monthOrders: number;
}
