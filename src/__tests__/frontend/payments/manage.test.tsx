```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentManage from '@/pages/payments/manage';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// モックデータ
const mockPayments = [
  {
    id: '1',
    companyId: 'comp-1', 
    amount: 10000,
    status: '未処理',
    dueDate: '2024-02-01'
  },
  {
    id: '2', 
    companyId: 'comp-2',
    amount: 20000,
    status: '処理済',
    dueDate: '2024-02-02'
  }
];

const mockBankSettings = {
  bankName: 'テスト銀行',
  branchCode: '001',
  accountNumber: '1234567',
  accountType: '普通'
};

// APIモック
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

mockedAxios.get.mockImplementation((url) => {
  if (url.includes('/api/payments')) {
    return Promise.resolve({ data: mockPayments });
  }
  if (url.includes('/api/bank-settings')) {
    return Promise.resolve({ data: mockBankSettings });
  }
  return Promise.reject(new Error('Not found'));
});

mockedAxios.post.mockImplementation((url) => {
  if (url.includes('/api/payments/process')) {
    return Promise.resolve({ data: { success: true } });
  }
  return Promise.reject(new Error('Not found'));
});

describe('支払管理画面テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('支払一覧が正しく表示される', async () => {
    render(<PaymentManage />);
    
    await waitFor(() => {
      expect(screen.getByText('¥10,000')).toBeInTheDocument();
      expect(screen.getByText('¥20,000')).toBeInTheDocument();
    });
    
    expect(screen.getByText('未処理')).toBeInTheDocument();
    expect(screen.getByText('処理済')).toBeInTheDocument();
  });

  it('振込設定が正しく表示される', async () => {
    render(<PaymentManage />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
      expect(screen.getByText('001')).toBeInTheDocument();
      expect(screen.getByText('1234567')).toBeInTheDocument();
    });
  });

  it('支払処理が実行できる', async () => {
    render(<PaymentManage />);
    
    await waitFor(() => {
      expect(screen.getByText('支払処理実行')).toBeInTheDocument();
    });

    const processButton = screen.getByText('支払処理実行');
    await userEvent.click(processButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/payments/process', expect.any(Object));
    });

    expect(screen.getByText('支払処理が完了しました')).toBeInTheDocument();
  });

  it('支払対象を選択できる', async () => {
    render(<PaymentManage />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockPayments.length);
    });

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await userEvent.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();
  });

  it('エラー時にエラーメッセージが表示される', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('支払処理に失敗しました'));
    
    render(<PaymentManage />);
    
    const processButton = await screen.findByText('支払処理実行');
    await userEvent.click(processButton);

    await waitFor(() => {
      expect(screen.getByText('支払処理に失敗しました')).toBeInTheDocument();
    });
  });

  it('検索フィルターが機能する', async () => {
    render(<PaymentManage />);

    const searchInput = screen.getByPlaceholderText('企業名で検索');
    await userEvent.type(searchInput, 'テスト企業');

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/payments?search=テスト企業')
      );
    });
  });

  it('ページネーションが機能する', async () => {
    render(<PaymentManage />);

    const nextPageButton = screen.getByRole('button', { name: '次のページ' });
    await userEvent.click(nextPageButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/payments?page=2')
      );
    });
  });

  it('支払状況でフィルタリングできる', async () => {
    render(<PaymentManage />);

    const statusSelect = screen.getByRole('combobox', { name: '支払状況' });
    await userEvent.selectOptions(statusSelect, '未処理');

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/payments?status=未処理')
      );
    });
  });

  it('支払履歴が表示される', async () => {
    render(<PaymentManage />);

    const historyTab = screen.getByRole('tab', { name: '支払履歴' });
    await userEvent.click(historyTab);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/payments/history');
    });
  });
});
```