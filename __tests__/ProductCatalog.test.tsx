// Fix: Import Jest globals to resolve TypeScript errors.
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCatalog from '../components/ProductCatalog';
import { Item, AlertConfigType } from '../types';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import '@testing-library/jest-dom';

// Mock the AI to prevent API calls
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      // FIX: Cast resolved value to 'any' to prevent TypeScript error where the parameter type was inferred as 'never'.
      generateContent: jest.fn().mockResolvedValue({ text: 'AI generated description.' } as any),
    },
  })),
}));

const mockItems: Item[] = [
  { id: 1, name: 'Netflix - Private', unit: 'Akun', minStock: 5, currentStock: 10, description: '', alertConfig: { type: AlertConfigType.DEFAULT, value: 0 }, category: 'Akun Streaming', groupName: 'Netflix', planName: 'Private', price: '120k', warranty: '', features: [], isVisibleInStore: true },
  { id: 2, name: 'Netflix - Sharing', unit: 'Akun', minStock: 5, currentStock: 20, description: '', alertConfig: { type: AlertConfigType.DEFAULT, value: 0 }, category: 'Akun Streaming', groupName: 'Netflix', planName: 'Sharing', price: '30k', warranty: '', features: [], isVisibleInStore: true },
  { id: 3, name: 'CapCut - Pro', unit: 'Lisensi', minStock: 5, currentStock: 50, description: '', alertConfig: { type: AlertConfigType.DEFAULT, value: 0 }, category: 'Lisensi Produktivitas', groupName: 'CapCut', planName: 'Pro', price: '20k', warranty: '', features: [], isVisibleInStore: true },
  { id: 4, name: 'Spotify - Premium', unit: 'Akun', minStock: 5, currentStock: 0, description: '', alertConfig: { type: AlertConfigType.DEFAULT, value: 0 }, category: 'Akun Streaming', groupName: 'Spotify', planName: 'Premium', price: '50k', warranty: '', features: [], isVisibleInStore: true },
];

const mockHandlers = {
  onSwitchToStock: jest.fn(),
  onSwitchToReseller: jest.fn(),
  onSwitchToRefund: jest.fn(),
  onAddSuggestion: jest.fn(),
  onUpdateSuggestion: jest.fn(),
  onDeleteSuggestion: jest.fn(),
  setFeedback: jest.fn(),
  onMarkNotificationAsRead: jest.fn(),
  onMarkAllNotificationsAsRead: jest.fn(),
  onDeleteUserNotification: jest.fn(),
  onAddToCart: jest.fn(),
  onQuickBuy: jest.fn(),
  onToggleCart: jest.fn(),
  onToggleWishlist: jest.fn(),
  onToggleWishlistPanel: jest.fn(),
  onSelectItemDetail: jest.fn(),
  onOpenBundleBuilder: jest.fn(),
};

const renderComponent = (props = {}) => {
  return render(
    <ThemeProvider>
      <NotificationProvider>
        <ProductCatalog
          items={mockItems}
          resellers={[]}
          transactions={[]}
          suggestions={[]}
          userNotifications={[]}
          cart={[]}
          wishlist={[]}
          {...mockHandlers}
          {...props}
        />
      </NotificationProvider>
    </ThemeProvider>
  );
};

describe('ProductCatalog', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders products grouped by category and group name', () => {
    renderComponent();
    // Check for category titles
    expect(screen.getByText('Akun Streaming')).toBeInTheDocument();
    expect(screen.getByText('Lisensi Produktivitas')).toBeInTheDocument();
    // Check for product group titles
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('CapCut')).toBeInTheDocument();
    expect(screen.getByText('Spotify')).toBeInTheDocument();
    // Check for plan names
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('Sharing')).toBeInTheDocument();
  });

  it('filters products based on search term', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText('Cari produk favoritmu...');
    await user.type(searchInput, 'CapCut');

    expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
    expect(screen.getByText('CapCut')).toBeInTheDocument();
  });

  it('filters products based on selected category', async () => {
    const user = userEvent.setup();
    renderComponent();

    const categoryButton = screen.getByRole('button', { name: /Lisensi Produktivitas/ });
    await user.click(categoryButton);

    expect(screen.queryByText('Akun Streaming')).not.toBeInTheDocument();
    expect(screen.getByText('Lisensi Produktivitas')).toBeInTheDocument();
    expect(screen.getByText('CapCut')).toBeInTheDocument();
  });

  it('sorts products by price ascending', async () => {
    const user = userEvent.setup();
    renderComponent();

    const sortSelect = screen.getByLabelText('Sort products');
    await user.selectOptions(sortSelect, 'price-asc');

    const productCards = screen.getByText('Netflix').closest('div.bg-gray-50');
    const plans = productCards!.querySelectorAll('h4');
    expect(plans[0]).toHaveTextContent('Sharing'); // 30k
    expect(plans[1]).toHaveTextContent('Private'); // 120k
  });

  it('calls onAddToCart when "Keranjang" button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const addToCartButtons = screen.getAllByRole('button', { name: /Keranjang/i });
    await user.click(addToCartButtons[0]); // Click first one (Netflix Private)

    expect(mockHandlers.onAddToCart).toHaveBeenCalledWith(1); // item id 1
  });

  it('calls onQuickBuy when "Beli Cepat" button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const quickBuyButton = screen.getAllByRole('button', { name: /Beli Cepat/i })[0];
    await user.click(quickBuyButton);

    expect(mockHandlers.onQuickBuy).toHaveBeenCalledWith(mockItems[0]);
  });

  it('calls onToggleWishlist when wishlist icon is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const wishlistButton = screen.getAllByLabelText('Tambah ke wishlist')[0];
    await user.click(wishlistButton);

    expect(mockHandlers.onToggleWishlist).toHaveBeenCalledWith(1);
  });
  
  it('calls onSelectItemDetail when a plan card is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const planCard = screen.getByText('Private').closest('div');
    await user.click(planCard!);
    
    expect(mockHandlers.onSelectItemDetail).toHaveBeenCalledWith(mockItems[0]);
  });


  it('disables buttons for out-of-stock items', () => {
    renderComponent();
    
    const spotifyCard = screen.getByText('Spotify').closest('.bg-gray-50');
    const outOfStockButton = spotifyCard!.querySelector('button:disabled');
    
    expect(outOfStockButton).toBeInTheDocument();
    expect(outOfStockButton).toHaveTextContent('Stok Habis');
  });

  it('displays correct item counts in header', () => {
    renderComponent({
      cart: [{ itemId: 1, quantity: 2 }, { itemId: 2, quantity: 1 }],
      wishlist: [3, 4]
    });

    const cartButton = screen.getByRole('button', { name: /shopping cart/i });
    const wishlistButton = screen.getByRole('button', { name: /heart/i });

    expect(cartButton.querySelector('span')).toHaveTextContent('3'); // 2 + 1
    expect(wishlistButton.querySelector('span')).toHaveTextContent('2');
  });
});
