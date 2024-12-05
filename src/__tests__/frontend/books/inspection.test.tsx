```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BookInspection from '@/pages/books/inspection';

// モックコンポーネント
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">ヘッダー</div>
  }
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">サイドバー</div>
  }
});

const mockBooks = [
  {
    id: '1',
    title: 'テスト書籍1',
    isbn: '9784123456789',
    status: '良好'
  },
  {
    id: '2', 
    title: 'テスト書籍2',
    isbn: '9784987654321',
    status: '要確認'
  }
];

const mockAxios = {
  get: jest.fn(() => Promise.resolve({ data: mockBooks })),
  put: jest.fn(() => Promise.resolve({ data: { success: true } }))
};

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios
}));

describe('蔵書点検画面', () => {
  beforeEach(() => {
    mockAxios.get.mockClear();
    mockAxios.put.mockClear();
  });

  it('初期表示時に蔵書データを取得して表示する', async () => {
    render(<BookInspection />);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
      expect(screen.getByText('テスト書籍2')).toBeInTheDocument();
    });
  });

  it('バーコードスキャン入力ができる', async () => {
    render(<BookInspection />);

    const barcodeInput = screen.getByPlaceholderText('バーコードをスキャンまたは入力');
    await userEvent.type(barcodeInput, '9784123456789');

    expect(barcodeInput).toHaveValue('9784123456789');
  });

  it('状態更新が正しく動作する', async () => {
    render(<BookInspection />);

    await waitFor(() => {
      expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('状態');
    fireEvent.change(statusSelect, { target: { value: '破損' } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAxios.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          id: '1',
          status: '破損'
        })
      );
    });
  });

  it('点検完了時に結果が表示される', async () => {
    render(<BookInspection />);

    await waitFor(() => {
      expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
    });

    const completeButton = screen.getByText('点検完了');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(screen.getByText('点検が完了しました')).toBeInTheDocument();
      expect(screen.getByText('総点検冊数: 2冊')).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージが表示される', async () => {
    mockAxios.get.mockRejectedValueOnce(new Error('データの取得に失敗しました'));
    
    render(<BookInspection />);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  it('必須コンポーネントが表示される', () => {
    render(<BookInspection />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
  });

  it('検索フィルターが機能する', async () => {
    render(<BookInspection />);

    await waitFor(() => {
      expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
      expect(screen.getByText('テスト書籍2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('書籍を検索');
    await userEvent.type(searchInput, 'テスト書籍1');

    expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
    expect(screen.queryByText('テスト書籍2')).not.toBeInTheDocument();
  });

  it('点検履歴が表示される', async () => {
    const mockHistory = [
      { date: '2023-12-01', count: 100 },
      { date: '2023-11-01', count: 95 }
    ];

    mockAxios.get.mockImplementationOnce(() => Promise.resolve({ data: mockBooks }))
             .mockImplementationOnce(() => Promise.resolve({ data: mockHistory }));

    render(<BookInspection />);

    const historyTab = screen.getByText('点検履歴');
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('2023-12-01')).toBeInTheDocument();
      expect(screen.getByText('2023-11-01')).toBeInTheDocument();
    });
  });
});
```