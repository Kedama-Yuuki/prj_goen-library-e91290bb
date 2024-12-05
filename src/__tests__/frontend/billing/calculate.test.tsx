```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import Calculate from '@/pages/billing/calculate';
import '@testing-library/jest-dom';

// モックデータ
const mockLendingRecords = [
  {
    id: '1',
    bookId: 'book1',
    borrowerId: 'user1', 
    lendingDate: '2024-01-01',
    returnDueDate: '2024-01-14',
    actualReturnDate: '2024-01-13',
    status: '返却済'
  }
];

const mockShippingRecords = [
  {
    id: '1',
    lendingRecordId: '1',
    type: '配送',
    trackingNumber: '123456',
    status: '配送完了'
  }
];

jest.mock('axios', () => ({
  get: jest.fn()
    .mockResolvedValueOnce({ data: mockLendingRecords })
    .mockResolvedValueOnce({ data: mockShippingRecords }),
  post: jest.fn().mockResolvedValue({ data: { id: 1 } })
}));

describe('料金計算画面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('画面の初期表示が正しい', async () => {
    render(<Calculate />);
    
    expect(screen.getByText('料金計算')).toBeInTheDocument();
    expect(screen.getByLabelText('利用期間（開始）')).toBeInTheDocument();
    expect(screen.getByLabelText('利用期間（終了）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '計算実行' })).toBeInTheDocument();
  });

  it('日付範囲を選択して料金計算を実行できる', async () => {
    render(<Calculate />);

    const startDate = screen.getByLabelText('利用期間（開始）');
    const endDate = screen.getByLabelText('利用期間（終了）');
    
    await act(async () => {
      await userEvent.type(startDate, '2024-01-01');
      await userEvent.type(endDate, '2024-01-31');
      
      fireEvent.click(screen.getByRole('button', { name: '計算実行' }));
    });

    await waitFor(() => {
      expect(screen.getByText('明細')).toBeInTheDocument();
      expect(screen.getByText('¥1,000')).toBeInTheDocument(); // 基本料金
    });
  });

  it('計算結果が表示される', async () => {
    render(<Calculate />);

    await act(async () => {
      await userEvent.type(screen.getByLabelText('利用期間（開始）'), '2024-01-01');
      await userEvent.type(screen.getByLabelText('利用期間（終了）'), '2024-01-31');
      fireEvent.click(screen.getByRole('button', { name: '計算実行' }));
    });

    await waitFor(() => {
      expect(screen.getByText('貸出料金')).toBeInTheDocument();
      expect(screen.getByText('配送料金')).toBeInTheDocument();
      expect(screen.getByText('合計金額')).toBeInTheDocument();
    });
  });

  it('バリデーションエラーが表示される', async () => {
    render(<Calculate />);

    fireEvent.click(screen.getByRole('button', { name: '計算実行' }));

    await waitFor(() => {
      expect(screen.getByText('利用期間を入力してください')).toBeInTheDocument();
    });
  });

  it('APIエラー時にエラーメッセージが表示される', async () => {
    const mockErrorMessage = 'データの取得に失敗しました';
    jest.spyOn(global.axios, 'get').mockRejectedValueOnce(new Error(mockErrorMessage));

    render(<Calculate />);

    await act(async () => {
      await userEvent.type(screen.getByLabelText('利用期間（開始）'), '2024-01-01');
      await userEvent.type(screen.getByLabelText('利用期間（終了）'), '2024-01-31');
      fireEvent.click(screen.getByRole('button', { name: '計算実行' }));
    });

    await waitFor(() => {
      expect(screen.getByText(mockErrorMessage)).toBeInTheDocument();
    });
  });

  it('明細データが正しく表示される', async () => {
    render(<Calculate />);

    await act(async () => {
      await userEvent.type(screen.getByLabelText('利用期間（開始）'), '2024-01-01');
      await userEvent.type(screen.getByLabelText('利用期間（終了）'), '2024-01-31');
      fireEvent.click(screen.getByRole('button', { name: '計算実行' }));
    });

    await waitFor(() => {
      expect(screen.getByText('book1')).toBeInTheDocument();
      expect(screen.getByText('2024-01-01 〜 2024-01-13')).toBeInTheDocument();
      expect(screen.getByText('123456')).toBeInTheDocument();
    });
  });

  it('計算結果を保存できる', async () => {
    render(<Calculate />);

    await act(async () => {
      await userEvent.type(screen.getByLabelText('利用期間（開始）'), '2024-01-01');
      await userEvent.type(screen.getByLabelText('利用期間（終了）'), '2024-01-31');
      fireEvent.click(screen.getByRole('button', { name: '計算実行' }));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: '保存' }));
    });

    expect(global.axios.post).toHaveBeenCalledWith(
      '/api/billing/records',
      expect.any(Object)
    );
  });
});
```