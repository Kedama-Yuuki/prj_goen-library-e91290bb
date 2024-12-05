```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import BookScanPage from '@/pages/books/scan';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

// モック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
};

const mockScanResult = {
  isbn: '9784123456789',
  title: 'テスト書籍',
  author: 'テスト著者',
  publisher: 'テスト出版'
};

describe('BookScanPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('正しくレンダリングされること', () => {
    render(<BookScanPage />);
    
    expect(screen.getByText('バーコードスキャン')).toBeInTheDocument();
    expect(screen.getByTestId('camera-view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument();
  });

  it('カメラが起動していない場合エラーメッセージが表示されること', async () => {
    render(<BookScanPage />);
    
    await waitFor(() => {
      expect(screen.getByText('カメラへのアクセスを許可してください')).toBeInTheDocument();
    });
  });

  it('バーコードスキャン成功時に結果が表示されること', async () => {
    render(<BookScanPage />);

    const scanButton = screen.getByRole('button', { name: 'スキャン開始' });
    await userEvent.click(scanButton);

    // スキャン成功イベントをシミュレート
    act(() => {
      const scannerComponent = screen.getByTestId('barcode-scanner');
      fireEvent(scannerComponent, new CustomEvent('scan-success', { 
        detail: mockScanResult 
      }));
    });

    await waitFor(() => {
      expect(screen.getByText(mockScanResult.title)).toBeInTheDocument();
      expect(screen.getByText(mockScanResult.author)).toBeInTheDocument();
    });
  });

  it('確認ボタンクリックで登録画面に遷移すること', async () => {
    render(<BookScanPage />);

    // スキャン結果を設定
    act(() => {
      const scannerComponent = screen.getByTestId('barcode-scanner');
      fireEvent(scannerComponent, new CustomEvent('scan-success', { 
        detail: mockScanResult 
      }));
    });

    const confirmButton = screen.getByRole('button', { name: '確認' });
    await userEvent.click(confirmButton);

    expect(mockRouter.push).toHaveBeenCalledWith(`/books/register?isbn=${mockScanResult.isbn}`);
  });

  it('スキャンエラー時にエラーメッセージが表示されること', async () => {
    render(<BookScanPage />);

    act(() => {
      const scannerComponent = screen.getByTestId('barcode-scanner');
      fireEvent(scannerComponent, new CustomEvent('scan-error', { 
        detail: 'スキャンに失敗しました' 
      }));
    });

    await waitFor(() => {
      expect(screen.getByText('スキャンに失敗しました')).toBeInTheDocument();
    });
  });

  it('再スキャンボタンでスキャナーがリセットされること', async () => {
    render(<BookScanPage />);

    // 一度スキャン
    act(() => {
      const scannerComponent = screen.getByTestId('barcode-scanner');
      fireEvent(scannerComponent, new CustomEvent('scan-success', { 
        detail: mockScanResult 
      }));
    });

    const rescanButton = screen.getByRole('button', { name: '再スキャン' });
    await userEvent.click(rescanButton);

    expect(screen.queryByText(mockScanResult.title)).not.toBeInTheDocument();
    expect(screen.getByTestId('camera-view')).toBeInTheDocument();
  });

  it('キャンセルボタンでホーム画面に戻ること', async () => {
    render(<BookScanPage />);

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await userEvent.click(cancelButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });
});
```