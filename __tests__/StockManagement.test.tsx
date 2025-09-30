// Fix: Import Jest globals to resolve TypeScript errors.
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StockManagement from '../components/StockManagement';
import { FeedbackMessage } from '../types';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';

// Mock child components to isolate the StockManagement component's logic
jest.mock('../components/Dashboard', () => () => <div>Dashboard View</div>);
jest.mock('../components/ManageItems', () => () => <div>ManageItems View</div>);
jest.mock('../components/Transactions', () => () => <div>Transactions View</div>);
jest.mock('../components/ManageResellers', () => () => <div>ManageResellers View</div>);
jest.mock('../components/History', () => () => <div>History View</div>);
jest.mock('../components/Reports', () => () => <div>Reports View</div>);

// Mock the AI to prevent API calls
jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn().mockResolvedValue({ functionCalls: [] }),
      },
    })),
    FunctionDeclaration: jest.fn(),
    Type: jest.fn(),
}));

const mockProps = {
    items: [],
    transactions: [],
    resellers: [],
    onAddItem: jest.fn(),
    onUpdateItem: jest.fn(),
    onDeleteItem: jest.fn(),
    onAddTransaction: jest.fn(),
    onBulkAddItems: jest.fn(),
    onAddReseller: jest.fn(),
    onInviteReseller: jest.fn(),
    onUpdateReseller: jest.fn(),
    onDeleteReseller: jest.fn(),
    onSwitchToStore: jest.fn(),
    feedback: null,
    clearFeedback: jest.fn(),
    setFeedback: jest.fn(),
};

const renderComponent = (props = {}) => {
  return render(
    <ThemeProvider>
      <NotificationProvider>
        <StockManagement {...mockProps} {...props} />
      </NotificationProvider>
    </ThemeProvider>
  );
};

describe('StockManagement', () => {

  beforeEach(() => {
    // Mock window.matchMedia for ThemeProvider in JSDOM
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('renders Dashboard view by default', () => {
    renderComponent();
    expect(screen.getByText('Dashboard View')).toBeInTheDocument();
  });

  it('switches to ManageItems view when "Kelola Item" is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const navButton = screen.getByRole('button', { name: /Kelola Item/i });
    await user.click(navButton);
    
    expect(screen.getByText('ManageItems View')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard View')).not.toBeInTheDocument();
  });

  it('switches to Transactions view when "Transaksi" is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const navButton = screen.getByRole('button', { name: /Transaksi/i });
    await user.click(navButton);
    
    expect(screen.getByText('Transactions View')).toBeInTheDocument();
  });

  it('switches to ManageResellers view when "Reseller" is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const navButton = screen.getByRole('button', { name: /Reseller/i });
    await user.click(navButton);
    
    expect(screen.getByText('ManageResellers View')).toBeInTheDocument();
  });

  it('switches to History view when "Riwayat" is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const navButton = screen.getByRole('button', { name: /Riwayat/i });
    await user.click(navButton);
    
    expect(screen.getByText('History View')).toBeInTheDocument();
  });

  it('switches to Reports view when "Laporan" is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const navButton = screen.getByRole('button', { name: /Laporan/i });
    await user.click(navButton);
    
    expect(screen.getByText('Reports View')).toBeInTheDocument();
  });

  it('calls onSwitchToStore when "Kembali ke Toko" button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const backButton = screen.getByRole('button', { name: /Kembali ke Toko/i });
    await user.click(backButton);
    
    expect(mockProps.onSwitchToStore).toHaveBeenCalled();
  });

  it('displays a feedback alert when feedback prop is provided', () => {
    const feedback: FeedbackMessage = { type: 'success', message: 'Operation successful!' };
    renderComponent({ feedback });
    
    expect(screen.getByText('Operation successful!')).toBeInTheDocument();
  });

  it('does not display a feedback alert when feedback prop is null', () => {
    renderComponent({ feedback: null });
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
