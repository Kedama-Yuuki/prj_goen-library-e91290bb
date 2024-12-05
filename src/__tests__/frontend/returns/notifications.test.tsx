```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import ReturnNotifications from '@/pages/returns/notifications';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// モックの設定
jest.mock('next/navigation');
jest.mock('axios');

const mockLendingRecords = [
  {
    id: '1',
    bookId: 'book-1',
    borrowerId: 'user-1',
    lendingDate: '2024-01-01',
    returnDueDate: '2024-02-01',
    status: '貸出中',
    bookTitle: 'テスト書籍1',
    borrowerName: 'テストユーザー1'
  },
  {
    id: '2', 
    bookId: 'book-2',
    borrowerId: 'user-2',
    lendingDate: '2024-01-15',
    returnDueDate: '2024-02-15',
    status: '貸出中',
    bookTitle: 'テスト書籍2',
    borrowerName: 'テストユーザー2'
  }
];

describe('ReturnNotifications', () => {
  beforeEach(() => {
    (axios.get as jest.Mock).mockResolvedValue({ 
      data: { lendingRecords: mockLendingRecords }
    });
  });

  test('画面の初期表示が正しく行われる', async () => {
    render(<ReturnNotifications />);
    
    await waitFor(() => {
      expect(screen.getByText('返却通知一覧')).toBeInTheDocument();
      expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
      expect(screen.getByText('テスト書籍2')).toBeInTheDocument();
    });
  });

  test('通知設定の変更が正しく動作する', async () => {
    render(<ReturnNotifications />);

    const settingButton = await screen.findByText('通知設定');
    fireEvent.click(settingButton);

    const emailToggle = screen.getByRole('checkbox', { name: 'メール通知' });
    fireEvent.click(emailToggle);

    expect(axios.post).toHaveBeenCalledWith('/api/notifications/settings', {
      emailEnabled: true
    });
  });

  test('返却催促送信が正しく動作する', async () => {
    render(<ReturnNotifications />);

    const sendButton = await screen.findByText('催促送信');
    fireEvent.click(sendButton);
    
    const confirmButton = screen.getByText('送信する');
    fireEvent.click(confirmButton);

    expect(axios.post).toHaveBeenCalledWith('/api/returns/remind', {
      lendingIds: ['1', '2']
    });
  });

  test('一括処理機能が正しく動作する', async () => {
    render(<ReturnNotifications />);

    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const bulkButton = screen.getByText('一括処理');
    fireEvent.click(bulkButton);

    const processButton = screen.getByText('処理実行');
    fireEvent.click(processButton);

    expect(axios.post).toHaveBeenCalledWith('/api/returns/bulk', {
      lendingIds: ['1', '2'],
      action: 'remind'
    });
  });

  test('エラー時のエラーメッセージ表示', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<ReturnNotifications />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  test('返却期限でのソートが正しく動作する', async () => {
    render(<ReturnNotifications />);

    const sortButton = await screen.findByText('返却期限');
    fireEvent.click(sortButton);

    await waitFor(() => {
      const items = screen.getAllByRole('row');
      expect(items[1]).toHaveTextContent('テスト書籍1');
      expect(items[2]).toHaveTextContent('テスト書籍2');
    });
  });

  test('検索フィルターが正しく動作する', async () => {
    render(<ReturnNotifications />);

    const searchInput = screen.getByPlaceholderText('書籍名で検索');
    fireEvent.change(searchInput, { target: { value: 'テスト書籍1' } });

    await waitFor(() => {
      expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
      expect(screen.queryByText('テスト書籍2')).not.toBeInTheDocument();
    });
  });
});
```