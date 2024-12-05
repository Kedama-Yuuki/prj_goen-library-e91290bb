```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import InvoicePage from '@/pages/billing/invoices';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockInvoices = [
  {
    id: '1',
    companyId: 'company-1',
    billingMonth: '2024-01',
    amount: 50000,
    status: '未払い',
    details: {
      利用料: 45000,
      配送料: 5000
    }
  },
  {
    id: '2', 
    companyId: 'company-2',
    billingMonth: '2024-01',
    amount: 30000,
    status: '支払済',
    details: {
      利用料: 28000,
      配送料: 2000
    }
  }
];

const mockGenerateInvoice = jest.fn();
const mockUpdateStatus = jest.fn();

describe('請求書管理画面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockInvoices),
      })
    ) as jest.Mock;
    
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
    }));
  });

  test('請求書一覧が正しく表示される', async () => {
    render(<InvoicePage />);
    
    await waitFor(() => {
      expect(screen.getByText('¥50,000')).toBeInTheDocument();
      expect(screen.getByText('¥30,000')).toBeInTheDocument();
    });
    
    expect(screen.getByText('未払い')).toBeInTheDocument();
    expect(screen.getByText('支払済')).toBeInTheDocument();
  });

  test('請求書を新規発行できる', async () => {
    render(<InvoicePage />);
    
    const generateButton = screen.getByText('請求書発行');
    await userEvent.click(generateButton);
    
    const monthSelect = screen.getByLabelText('請求対象月');
    await userEvent.selectOptions(monthSelect, '2024-01');
    
    const submitButton = screen.getByText('発行する');
    await userEvent.click(submitButton);
    
    expect(mockGenerateInvoice).toHaveBeenCalledWith({
      billingMonth: '2024-01'
    });
  });

  test('請求書のステータスを更新できる', async () => {
    render(<InvoicePage />);
    
    await waitFor(() => {
      const statusButton = screen.getAllByText('未払い')[0];
      fireEvent.click(statusButton);
    });
    
    const paidOption = screen.getByText('支払済にする');
    await userEvent.click(paidOption);
    
    expect(mockUpdateStatus).toHaveBeenCalledWith('1', '支払済');
  });

  test('請求書詳細を表示できる', async () => {
    render(<InvoicePage />);
    
    const firstInvoice = await screen.findByText('¥50,000');
    await userEvent.click(firstInvoice);
    
    expect(screen.getByText('利用料: ¥45,000')).toBeInTheDocument();
    expect(screen.getByText('配送料: ¥5,000')).toBeInTheDocument();
  });

  test('エラー時にエラーメッセージが表示される', async () => {
    global.fetch = jest.fn(() => 
      Promise.reject(new Error('データの取得に失敗しました'))
    ) as jest.Mock;

    render(<InvoicePage />);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  test('請求書の検索ができる', async () => {
    render(<InvoicePage />);

    const searchInput = screen.getByPlaceholderText('企業名で検索');
    await userEvent.type(searchInput, 'company-1');

    await waitFor(() => {
      expect(screen.getByText('¥50,000')).toBeInTheDocument();
      expect(screen.queryByText('¥30,000')).not.toBeInTheDocument();
    });
  });

  test('請求書のソートができる', async () => {
    render(<InvoicePage />);

    const sortButton = screen.getByText('金額');
    await userEvent.click(sortButton);

    const invoiceAmounts = screen.getAllByTestId('invoice-amount');
    expect(invoiceAmounts[0]).toHaveTextContent('¥30,000');
    expect(invoiceAmounts[1]).toHaveTextContent('¥50,000');
  });

  test('請求書のフィルタリングができる', async () => {
    render(<InvoicePage />);

    const filterButton = screen.getByText('ステータス');
    await userEvent.click(filterButton);

    const unpaidFilter = screen.getByLabelText('未払いのみ表示');
    await userEvent.click(unpaidFilter);

    expect(screen.getByText('¥50,000')).toBeInTheDocument();
    expect(screen.queryByText('¥30,000')).not.toBeInTheDocument();
  });

  test('PDFダウンロードができる', async () => {
    const mockBlob = new Blob(['dummy pdf content'], { type: 'application/pdf' });
    global.URL.createObjectURL = jest.fn();
    
    render(<InvoicePage />);

    const downloadButton = screen.getAllByText('PDFダウンロード')[0];
    await userEvent.click(downloadButton);

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  test('一括処理が実行できる', async () => {
    render(<InvoicePage />);

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[1]);
    await userEvent.click(checkboxes[2]);

    const bulkActionButton = screen.getByText('一括処理');
    await userEvent.click(bulkActionButton);

    const sendMailButton = screen.getByText('メール送信');
    await userEvent.click(sendMailButton);

    expect(screen.getByText('2件のメールを送信しました')).toBeInTheDocument();
  });
});
```