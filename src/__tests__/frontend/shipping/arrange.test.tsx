```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import ShippingArrangePage from '@/pages/shipping/arrange';
import axios from 'axios';

jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

const mockShippingCarriers = [
  { id: 1, name: 'ヤマト運輸', price: 800 },
  { id: 2, name: '佐川急便', price: 750 },
];

const mockLendingRecord = {
  id: 'abc-123',
  book: {
    title: 'テスト書籍',
    publisher: 'テスト出版'
  },
  borrower: {
    name: 'テストユーザー',
    address: '東京都渋谷区'
  }
};

describe('配送手配画面', () => {
  beforeEach(() => {
    // APIモックのリセット
    jest.clearAllMocks();
    
    // API レスポンスのモック
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockLendingRecord });
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockShippingCarriers });
  });

  it('画面の初期表示が正しく行われること', async () => {
    render(<ShippingArrangePage />);

    // ヘッダーとサイドバーが表示されていること
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();

    // フォームの初期表示を確認
    await waitFor(() => {
      expect(screen.getByText('配送手配')).toBeInTheDocument();
      expect(screen.getByText('テスト書籍')).toBeInTheDocument();
      expect(screen.getByText('テストユーザー')).toBeInTheDocument();
    });
  });

  it('配送業者選択で料金が更新されること', async () => {
    render(<ShippingArrangePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('配送業者')).toBeInTheDocument();
    });

    const carrierSelect = screen.getByLabelText('配送業者');
    fireEvent.change(carrierSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('800円')).toBeInTheDocument();
    });
  });

  it('必須項目が未入力の場合エラーが表示されること', async () => {
    render(<ShippingArrangePage />);

    const submitButton = await screen.findByText('配送手配を実行');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('配送業者を選択してください')).toBeInTheDocument();
    });
  });

  it('配送手配が正常に完了すること', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: {
        trackingNumber: '1234-5678-90',
        status: 'created'
      }
    });

    render(<ShippingArrangePage />);

    // 配送業者の選択
    const carrierSelect = await screen.findByLabelText('配送業者');
    fireEvent.change(carrierSelect, { target: { value: '1' } });

    // 備考の入力
    const notesInput = screen.getByLabelText('備考');
    await userEvent.type(notesInput, 'テスト備考');

    // 手配実行
    const submitButton = screen.getByText('配送手配を実行');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('配送手配が完了しました')).toBeInTheDocument();
      expect(screen.getByText('追跡番号: 1234-5678-90')).toBeInTheDocument();
    });
  });

  it('APIエラー時にエラーメッセージが表示されること', async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<ShippingArrangePage />);

    // 配送業者の選択
    const carrierSelect = await screen.findByLabelText('配送業者');
    fireEvent.change(carrierSelect, { target: { value: '1' } });

    // 手配実行
    const submitButton = screen.getByText('配送手配を実行');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('配送手配に失敗しました')).toBeInTheDocument();
    });
  });

  it('キャンセルボタンクリックで確認ダイアログが表示されること', async () => {
    render(<ShippingArrangePage />);

    const cancelButton = await screen.findByText('キャンセル');
    fireEvent.click(cancelButton);

    expect(screen.getByText('入力内容が破棄されますがよろしいですか？')).toBeInTheDocument();
  });

  it('住所情報の自動入力が機能すること', async () => {
    render(<ShippingArrangePage />);

    const zipCodeInput = await screen.findByLabelText('郵便番号');
    await userEvent.type(zipCodeInput, '1500013');

    await waitFor(() => {
      expect(screen.getByLabelText('住所').getAttribute('value')).toBe('東京都渋谷区恵比寿');
    });
  });
});
```