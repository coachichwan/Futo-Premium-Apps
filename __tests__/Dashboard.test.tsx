// Fix: Import Jest globals to resolve TypeScript errors.
import { describe, it, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import { Item, Transaction, TransactionType, Reseller, AlertConfigType } from '../types';
import { ThemeProvider } from '../contexts/ThemeContext';
import '@testing-library/jest-dom';

// Mock data for testing
const mockResellers: Reseller[] = [
  { id: 1, name: 'Top Seller', whatsappNumber: '123', joinDate: new Date().toISOString(), commissionRate: 10, status: 'active' },
];

const mockItems: Item[] = [
  { id: 1, name: 'Netflix', unit: 'Akun', minStock: 5, currentStock: 3, description: '', alertConfig: { type: AlertConfigType.DEFAULT, value: 0 }, category: 'Streaming', groupName: 'Netflix', planName: 'Private', price: '100k', warranty: '', features: [], isVisibleInStore: true },
  { id: 2, name: 'Spotify', unit: 'Akun', minStock: 10, currentStock: 20, description: '', alertConfig: { type: AlertConfigType.DEFAULT, value: 0 }, category: 'Music', groupName: 'Spotify', planName: 'Premium', price: '50k', warranty: '', features: [], isVisibleInStore: true },
  { id: 3, name: 'CapCut', unit: 'Lisensi', minStock: 2, currentStock: 5, description: '', alertConfig: { type: AlertConfigType.DEFAULT, value: 0 }, category: 'Productivity', groupName: 'CapCut', planName: 'Pro', price: '20k', warranty: '', features: [], isVisibleInStore: true },
];

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 25);

const sixtyDaysAgo = new Date();
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

const mockTransactions: Transaction[] = [
  // Within 30 days
  { id: 1, itemId: 1, type: TransactionType.OUT, quantity: 2, date: thirtyDaysAgo.toISOString(), description: 'Sale 1', resellerId: 1 }, // Revenue: 2 * 100k = 200k
  // Within 30 days
  { id: 2, itemId: 2, type: TransactionType.OUT, quantity: 1, date: new Date().toISOString(), description: 'Sale 2' }, // Revenue: 1 * 50k = 50k
  // Outside 30 days (should not be counted for revenue)
  { id: 3, itemId: 3, type: TransactionType.OUT, quantity: 5, date: sixtyDaysAgo.toISOString(), description: 'Old Sale' },
  { id: 4, itemId: 2, type: TransactionType.IN, quantity: 10, date: new Date().toISOString(), description: 'Restock' },
];

describe('Dashboard', () => {
  beforeEach(() => {
    render(
      <ThemeProvider>
        <Dashboard items={mockItems} transactions={mockTransactions} resellers={mockResellers} />
      </ThemeProvider>
    );
  });

  it('renders the main dashboard title', () => {
    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
  });

  it('calculates and displays the total stock correctly', () => {
    // 3 + 20 + 5 = 28
    expect(screen.getByText('Total Stok')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('calculates and displays the number of low stock items correctly', () => {
    // Netflix stock (3) <= minStock (5), so 1 item is low.
    const lowStockCard = screen.getByText('Stok Menipis').closest('.p-6');
    expect(lowStockCard).toBeInTheDocument();
    expect(lowStockCard).toHaveTextContent('1');
  });

  it('calculates and displays total revenue for the last 30 days correctly', () => {
    // Sale 1 (200k) + Sale 2 (50k) = 250k. Old sale is ignored.
    expect(screen.getByText('Pendapatan (30 Hari)')).toBeInTheDocument();
    expect(screen.getByText('Rp 250.000')).toBeInTheDocument();
  });

  it('displays the total number of transactions correctly', () => {
    expect(screen.getByText('Total Transaksi')).toBeInTheDocument();
    expect(screen.getByText(mockTransactions.length.toString())).toBeInTheDocument();
  });

  it('renders the sales trend chart section', () => {
    expect(screen.getByText(/Tren & Prediksi Pendapatan/)).toBeInTheDocument();
  });

  it('lists the best-selling products correctly', () => {
    // CapCut has 5 sales, Netflix has 2, Spotify has 1
    const topProductsList = screen.getByText('Produk Terlaris').closest('div');
    expect(topProductsList).toHaveTextContent('CapCut');
    expect(topProductsList).toHaveTextContent('5 terjual');
    expect(topProductsList).toHaveTextContent('Netflix');
    expect(topProductsList).toHaveTextContent('2 terjual');
    expect(topProductsList).toHaveTextContent('Spotify');
    expect(topProductsList).toHaveTextContent('1 terjual');
  });

  it('lists the top resellers correctly', () => {
    // Top Seller has 2 sales from transaction id 1
    const topResellersList = screen.getByText('Reseller Teratas').closest('div');
    expect(topResellersList).toHaveTextContent('Top Seller');
    expect(topResellersList).toHaveTextContent('2 terjual');
  });
});
