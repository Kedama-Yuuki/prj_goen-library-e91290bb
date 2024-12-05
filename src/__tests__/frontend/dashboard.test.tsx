```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import Dashboard from '@/pages/dashboard';
import axios from 'axios';

jest.mock('@/components/Header', () => {
  return function DummyHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/components/Footer', () => {
  return function DummyFooter() {
    return <div data-testid="mock-footer">Footer</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function DummySidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

jest.mock('@/components/NotificationPanel', () => {
  return function DummyNotificationPanel({ notifications }) {
    return (
      <div data-testid="mock-notification-panel">
        {notifications.map((n: any) => (
          <div key={n.id}>{n.message}</div>
        ))}
      </div>
    );
  };
});

const mockStats = {
  totalBooks: 100,
  availableBooks: 80,
  lendingBooks: 20,
  overdueLendings: 5
};

const mockNotifications = [
  { id: 1, message: 'お知らせ1', isRead: false },
  { id: 2, message: 'お知らせ2', isRead: false }
];

describe('Dashboard', () => {
  beforeEach(() => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/stats')) {
        return Promise.resolve({ data: mockStats });
      }
      if (url.includes('/api/notifications')) {
        return Promise.resolve({ data: mockNotifications });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('正しくレンダリングされること', async () => {
    render(<Dashboard />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    });
  });

  it('統計情報が正しく表示されること', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('総蔵書数: 100')).toBeInTheDocument();
      expect(screen.getByText('貸出可能数: 80')).toBeInTheDocument();
      expect(screen.getByText('貸出中: 20')).toBeInTheDocument();
      expect(screen.getByText('延滞数: 5')).toBeInTheDocument();
    });
  });

  it('お知らせが正しく表示されること', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('お知らせ1')).toBeInTheDocument();
      expect(screen.getByText('お知らせ2')).toBeInTheDocument();
    });
  });

  it('クイックアクセスボタンが機能すること', async () => {
    render(<Dashboard />);

    const registerButton = screen.getByText('蔵書登録');
    const searchButton = screen.getByText('蔵書検索');
    
    fireEvent.click(registerButton);
    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/books/register');
    
    fireEvent.click(searchButton);
    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/books/search');
  });

  it('APIエラー時にエラーメッセージが表示されること', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });
});
```