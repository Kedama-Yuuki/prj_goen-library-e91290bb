```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchFilter from '@/pages/SearchFilter';
import '@testing-library/jest-dom';

const mockFilters = [
  {
    id: '1',
    label: '出版社',
    options: [
      { value: 'pub1', label: '出版社A' },
      { value: 'pub2', label: '出版社B' }
    ]
  },
  {
    id: '2', 
    label: 'カテゴリ',
    options: [
      { value: 'cat1', label: 'ビジネス' },
      { value: 'cat2', label: '技術書' }
    ]
  }
];

const mockOnFilter = jest.fn();

describe('SearchFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィルターの選択肢が正しく表示される', () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />);
    
    expect(screen.getByText('出版社')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ')).toBeInTheDocument();
    expect(screen.getByText('出版社A')).toBeInTheDocument();
    expect(screen.getByText('ビジネス')).toBeInTheDocument();
  });

  it('フィルターを選択するとonFilter関数が呼ばれる', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />);

    const checkbox = screen.getByLabelText('出版社A');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith({
        pub1: true
      });
    });
  });

  it('複数のフィルターを選択できる', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />);

    const checkbox1 = screen.getByLabelText('出版社A');
    const checkbox2 = screen.getByLabelText('ビジネス');

    fireEvent.click(checkbox1);
    fireEvent.click(checkbox2);

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenLastCalledWith({
        pub1: true,
        cat1: true
      });
    });
  });

  it('フィルターの選択を解除できる', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />);

    const checkbox = screen.getByLabelText('出版社A');
    
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenLastCalledWith({});
    });
  });

  it('すべてクリアボタンで選択をリセットできる', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />);

    const checkbox1 = screen.getByLabelText('出版社A');
    const checkbox2 = screen.getByLabelText('ビジネス');
    
    fireEvent.click(checkbox1);
    fireEvent.click(checkbox2);

    const clearButton = screen.getByText('すべてクリア');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenLastCalledWith({});
      expect(checkbox1).not.toBeChecked();
      expect(checkbox2).not.toBeChecked();
    });
  });

  it('フィルターグループの展開/折りたたみができる', () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />);

    const expandButton = screen.getAllByRole('button', { name: /展開する/i })[0];
    
    fireEvent.click(expandButton);
    expect(screen.getByText('出版社A')).toBeVisible();
    
    fireEvent.click(expandButton);
    expect(screen.getByText('出版社A')).not.toBeVisible();
  });

  it('フィルターの検索が機能する', async () => {
    render(<SearchFilter filters={mockFilters} onFilter={mockOnFilter} />);

    const searchInput = screen.getByPlaceholderText('フィルター検索');
    await userEvent.type(searchInput, '出版社A');

    expect(screen.getByText('出版社A')).toBeVisible();
    expect(screen.queryByText('出版社B')).not.toBeVisible();
  });

  it('フィルターが空の場合適切に表示される', () => {
    render(<SearchFilter filters={[]} onFilter={mockOnFilter} />);
    
    expect(screen.getByText('フィルターがありません')).toBeInTheDocument();
  });
});
```