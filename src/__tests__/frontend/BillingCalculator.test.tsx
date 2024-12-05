```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BillingCalculator from '@/pages/BillingCalculator';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

const mockLendingRecords = [
  {
    id: '1',
    bookId: 'book1',
    borrowerId: 'user1',
    lendingDate: '2024-01-01',
    returnDueDate: '2024-01-15',
    actualReturnDate: '2024-01-14',
    status: '返却済み'
  },
  {
    id: '2', 
    bookId: 'book2',
    borrowerId: 'user1',
    lendingDate: '2024-01-05',
    returnDueDate: '2024-01-20',
    actualReturnDate: null,
    status: '貸出中'
  }
];

const mockShippingRecords = [
  {
    id: '1',
    lendingRecordId: '1',
    type: '発送',
    trackingNumber: 'track001',
    status: '配送完了'
  },
  {
    id: '2',
    lendingRecordId: '1', 
    type: '返却',
    trackingNumber: 'track002',
    status: '配送完了'
  }
];

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      back: jest.fn()
    };
  }
}));

describe('BillingCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('料金計算コンポーネントが正しくレンダリングされる', () => {
    render(
      <BillingCalculator 
        lendingRecords={mockLendingRecords}
        shippingRecords={mockShippingRecords}
      />
    );

    expect(screen.getByText('料金計算')).toBeInTheDocument();
    expect(screen.getByText('貸出料金')).toBeInTheDocument();
    expect(screen.getByText('配送料金')).toBeInTheDocument();
  });

  test('貸出記録と配送記録の合計金額が正しく計算される', () => {
    render(
      <BillingCalculator
        lendingRecords={mockLendingRecords}
        shippingRecords={mockShippingRecords} 
      />
    );

    expect(screen.getByTestId('total-lending-fee')).toHaveTextContent('2,000円');
    expect(screen.getByTestId('total-shipping-fee')).toHaveTextContent('1,600円');
    expect(screen.getByTestId('total-amount')).toHaveTextContent('3,600円');
  });

  test('期間フィルターで料金が再計算される', async () => {
    render(
      <BillingCalculator
        lendingRecords={mockLendingRecords}
        shippingRecords={mockShippingRecords}
      />
    );

    const startDateInput = screen.getByLabelText('開始日');
    const endDateInput = screen.getByLabelText('終了日');

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' }});
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' }});

    const calculateButton = screen.getByRole('button', { name: '再計算' });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('total-amount')).toHaveTextContent('3,600円');
    });
  });

  test('請求書プレビューボタンをクリックすると請求書が表示される', async () => {
    render(
      <BillingCalculator
        lendingRecords={mockLendingRecords}
        shippingRecords={mockShippingRecords}
      />
    );

    const previewButton = screen.getByRole('button', { name: '請求書プレビュー' });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByTestId('invoice-preview')).toBeInTheDocument();
      expect(screen.getByText('請求書番号:')).toBeInTheDocument();
      expect(screen.getByText('請求日:')).toBeInTheDocument();
    });
  });

  test('エラー状態が正しく表示される', async () => {
    const mockErrorLendingRecords = [...mockLendingRecords];
    mockErrorLendingRecords[0].status = 'エラー';

    render(
      <BillingCalculator
        lendingRecords={mockErrorLendingRecords}
        shippingRecords={mockShippingRecords}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('計算エラーが発生しました')).toBeInTheDocument();
    });
  });

  test('明細ダウンロードボタンがクリックされると、CSVがダウンロードされる', async () => {
    global.URL.createObjectURL = jest.fn();
    const mockCreateElement = jest.spyOn(document, 'createElement');
    const mockClick = jest.fn();

    mockCreateElement.mockReturnValue({
      click: mockClick,
      download: '',
      href: '',
      style: { display: '' },
    } as unknown as HTMLAnchorElement);

    render(
      <BillingCalculator
        lendingRecords={mockLendingRecords}
        shippingRecords={mockShippingRecords}
      />
    );

    const downloadButton = screen.getByRole('button', { name: '明細ダウンロード' });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockClick).toHaveBeenCalled();
    });
  });
});
```