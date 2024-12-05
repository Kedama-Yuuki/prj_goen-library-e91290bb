```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookList from '@/pages/BookList';

const mockBooks = [
  {
    id: '1',
    companyId: 'company1',
    isbn: '9784123456789',
    title: 'テスト本1',
    author: 'テスト著者1',
    publisher: 'テスト出版社1',
    lendingConditions: {
      period: 14,
      fee: 500
    },
    status: '貸出可能'
  },
  {
    id: '2', 
    companyId: 'company1',
    isbn: '9784987654321',
    title: 'テスト本2',
    author: 'テスト著者2',
    publisher: 'テスト出版社2',
    lendingConditions: {
      period: 7,
      fee: 300
    },
    status: '貸出中'
  }
];

const mockOnSort = jest.fn();

describe('BookList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('書籍一覧が正しく表示される', () => {
    render(<BookList books={mockBooks} onSort={mockOnSort} />);
    
    expect(screen.getByText('テスト本1')).toBeInTheDocument();
    expect(screen.getByText('テスト著者1')).toBeInTheDocument();
    expect(screen.getByText('テスト出版社1')).toBeInTheDocument();
    expect(screen.getByText('貸出可能')).toBeInTheDocument();
    
    expect(screen.getByText('テスト本2')).toBeInTheDocument();
    expect(screen.getByText('テスト著者2')).toBeInTheDocument();
    expect(screen.getByText('テスト出版社2')).toBeInTheDocument();
    expect(screen.getByText('貸出中')).toBeInTheDocument();
  });

  it('空の書籍一覧が表示される', () => {
    render(<BookList books={[]} onSort={mockOnSort} />);
    expect(screen.getByText('表示する書籍がありません')).toBeInTheDocument();
  });

  it('ソートボタンをクリックするとonSort関数が呼ばれる', async () => {
    render(<BookList books={mockBooks} onSort={mockOnSort} />);
    
    const titleSortButton = screen.getByRole('button', { name: 'タイトル順' });
    await userEvent.click(titleSortButton);
    
    expect(mockOnSort).toHaveBeenCalledTimes(1);
    expect(mockOnSort).toHaveBeenCalledWith('title');
  });

  it('ステータスフィルターが機能する', async () => {
    render(<BookList books={mockBooks} onSort={mockOnSort} />);
    
    const statusFilter = screen.getByLabelText('ステータス');
    await userEvent.selectOptions(statusFilter, '貸出可能');

    expect(screen.getByText('テスト本1')).toBeInTheDocument();
    expect(screen.queryByText('テスト本2')).not.toBeInTheDocument();
  });

  it('検索フィルターが機能する', async () => {
    render(<BookList books={mockBooks} onSort={mockOnSort} />);
    
    const searchInput = screen.getByPlaceholderText('書籍を検索...');
    await userEvent.type(searchInput, 'テスト本1');

    expect(screen.getByText('テスト本1')).toBeInTheDocument();
    expect(screen.queryByText('テスト本2')).not.toBeInTheDocument();
  });

  it('列ヘッダーをクリックするとソートが切り替わる', async () => {
    render(<BookList books={mockBooks} onSort={mockOnSort} />);
    
    const titleHeader = screen.getByRole('columnheader', { name: 'タイトル' });
    await userEvent.click(titleHeader);
    
    expect(mockOnSort).toHaveBeenCalledWith('title', 'asc');
    
    await userEvent.click(titleHeader);
    expect(mockOnSort).toHaveBeenCalledWith('title', 'desc');
  });

  it('ページネーションが機能する', async () => {
    const manyBooks = Array(25).fill(null).map((_, index) => ({
      ...mockBooks[0],
      id: String(index),
      title: `テスト本${index + 1}`
    }));

    render(<BookList books={manyBooks} onSort={mockOnSort} />);
    
    expect(screen.getByText('テスト本1')).toBeInTheDocument();
    expect(screen.queryByText('テスト本21')).not.toBeInTheDocument();

    const nextPageButton = screen.getByRole('button', { name: '次のページ' });
    await userEvent.click(nextPageButton);

    expect(screen.queryByText('テスト本1')).not.toBeInTheDocument();
    expect(screen.getByText('テスト本21')).toBeInTheDocument();
  });

  it('表示件数の変更が機能する', async () => {
    const manyBooks = Array(50).fill(null).map((_, index) => ({
      ...mockBooks[0],
      id: String(index),
      title: `テスト本${index + 1}`
    }));

    render(<BookList books={manyBooks} onSort={mockOnSort} />);
    
    const pageSizeSelect = screen.getByLabelText('表示件数');
    await userEvent.selectOptions(pageSizeSelect, '50');

    expect(screen.getByText('テスト本1')).toBeInTheDocument();
    expect(screen.getByText('テスト本50')).toBeInTheDocument();
  });

  it('エラー状態が表示される', () => {
    render(<BookList books={null} onSort={mockOnSort} />);
    expect(screen.getByText('書籍データの取得に失敗しました')).toBeInTheDocument();
  });
});
```