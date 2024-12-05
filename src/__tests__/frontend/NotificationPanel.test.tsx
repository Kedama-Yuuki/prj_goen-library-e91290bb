```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationPanel from '@/pages/NotificationPanel';
import { jest } from '@jest/globals';

const mockNotifications = [
  {
    id: '1',
    title: '新着書籍のお知らせ',
    message: '「プログラミング入門」が追加されました',
    isRead: false,
    createdAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2', 
    title: '返却期限のお知らせ',
    message: '「デザインパターン入門」の返却期限が近づいています',
    isRead: true,
    createdAt: '2024-01-02T09:00:00Z'
  }
];

const mockOnRead = jest.fn();

describe('NotificationPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('通知一覧が正しく表示される', () => {
    render(<NotificationPanel notifications={mockNotifications} onRead={mockOnRead} />);
    
    expect(screen.getByText('新着書籍のお知らせ')).toBeInTheDocument();
    expect(screen.getByText('「プログラミング入門」が追加されました')).toBeInTheDocument();
    expect(screen.getByText('返却期限のお知らせ')).toBeInTheDocument();
  });

  it('未読通知が強調表示される', () => {
    render(<NotificationPanel notifications={mockNotifications} onRead={mockOnRead} />);
    
    const unreadNotification = screen.getByText('新着書籍のお知らせ').closest('div');
    expect(unreadNotification).toHaveClass('bg-blue-50');
  });

  it('通知をクリックすると既読になる', async () => {
    render(<NotificationPanel notifications={mockNotifications} onRead={mockOnRead} />);
    
    const notification = screen.getByText('新着書籍のお知らせ');
    fireEvent.click(notification);

    await waitFor(() => {
      expect(mockOnRead).toHaveBeenCalledWith('1');
    });
  });

  it('通知がない場合は適切なメッセージを表示', () => {
    render(<NotificationPanel notifications={[]} onRead={mockOnRead} />);
    
    expect(screen.getByText('通知はありません')).toBeInTheDocument();
  });

  it('通知の日時が正しいフォーマットで表示される', () => {
    render(<NotificationPanel notifications={mockNotifications} onRead={mockOnRead} />);
    
    expect(screen.getByText('2024年1月1日 19:00')).toBeInTheDocument();
    expect(screen.getByText('2024年1月2日 18:00')).toBeInTheDocument();
  });

  it('最大表示件数を超える場合、スクロール可能なリストになる', () => {
    const manyNotifications = Array(20).fill(null).map((_, index) => ({
      id: String(index),
      title: `通知 ${index}`,
      message: `メッセージ ${index}`,
      isRead: false,
      createdAt: '2024-01-01T10:00:00Z'
    }));

    render(<NotificationPanel notifications={manyNotifications} onRead={mockOnRead} />);
    
    const notificationList = screen.getByRole('list');
    expect(notificationList).toHaveClass('max-h-96 overflow-y-auto');
  });

  it('既読/未読の表示が正しく切り替わる', async () => {
    const { rerender } = render(
      <NotificationPanel notifications={mockNotifications} onRead={mockOnRead} />
    );

    const updatedNotifications = mockNotifications.map(n => 
      n.id === '1' ? { ...n, isRead: true } : n
    );

    rerender(
      <NotificationPanel notifications={updatedNotifications} onRead={mockOnRead} />
    );

    const notification = screen.getByText('新着書籍のお知らせ').closest('div');
    expect(notification).not.toHaveClass('bg-blue-50');
  });

  it('通知パネルのタイトルが表示される', () => {
    render(<NotificationPanel notifications={mockNotifications} onRead={mockOnRead} />);
    
    expect(screen.getByText('通知')).toBeInTheDocument();
    expect(screen.getByText('未読: 1件')).toBeInTheDocument();
  });

  it('通知を全て既読にするボタンが機能する', async () => {
    render(<NotificationPanel notifications={mockNotifications} onRead={mockOnRead} />);
    
    const markAllReadButton = screen.getByText('全て既読にする');
    fireEvent.click(markAllReadButton);

    await waitFor(() => {
      mockNotifications.forEach(notification => {
        if (!notification.isRead) {
          expect(mockOnRead).toHaveBeenCalledWith(notification.id);
        }
      });
    });
  });
});
```