```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import SearchResults from '@/pages/SearchResults';
import '@testing-library/jest-dom';

const mockBooks = [
  {
    id: '1',
    company_id: 'comp1',
    isbn: '9784123456789',
    title: 'テスト書籍1',
    author: 'テスト著者1',
    publisher: 'テスト出版社1',
    lending_conditions: {
      lending_period: 14,
      shipping_fee: 500
    },
    status: '貸出可能'
  },
  {
    id: '2', 
    company_id: 'comp1',
    isbn: '9784987654321',
    title: 'テスト書籍2',
    author: 'テスト著者2',
    publisher: 'テスト出版社2',
    lending_conditions: {
      lending_period: 14,
      shipping_fee: 500  
    },
    status: '貸出中'
  }
];

describe('SearchResults', () => {
  it('検索結果の総数が表示されること', () => {
    render(<SearchResults results={mockBooks} totalCount={2} />);
    expect(screen.getByText('検索結果: 2件')).toBeInTheDocument();
  });

  it('検索結果の一覧が表示されること', () => {
    render(<SearchResults results={mockBooks} totalCount={2} />);
    expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
    expect(screen.getByText('テスト書籍2')).toBeInTheDocument();
    expect(screen.getByText('テスト著者1')).toBeInTheDocument();
    expect(screen.getByText('テスト著者2')).toBeInTheDocument();
  });

  it('検索結果が0件の場合、メッセージが表示されること', () => {
    render(<SearchResults results={[]} totalCount={0} />);
    expect(screen.getByText('該当する書籍が見つかりませんでした')).toBeInTheDocument();
  });

  it('貸出状態に応じて適切なステータスが表示されること', () => {
    render(<SearchResults results={mockBooks} totalCount={2} />);
    expect(screen.getByText('貸出可能')).toHaveClass('text-green-600');
    expect(screen.getByText('貸出中')).toHaveClass('text-red-600');
  });

  it('ソート機能が正しく動作すること', () => {
    render(<SearchResults results={mockBooks} totalCount={2} />);
    const sortSelect = screen.getByRole('combobox', { name: 'ソート順' });
    fireEvent.change(sortSelect, { target: { value: 'title_asc' } });
    expect(sortSelect).toHaveValue('title_asc');
  });

  it('ページネーションが正しく表示されること', () => {
    const manyBooks = Array(20).fill(null).map((_, i) => ({
      ...mockBooks[0],
      id: String(i),
      title: `テスト書籍${i}`
    }));
    
    render(<SearchResults results={manyBooks} totalCount={20} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('1')).toHaveClass('bg-blue-500');
  });

  it('詳細表示ボタンがクリック可能であること', () => {
    render(<SearchResults results={mockBooks} totalCount={2} />);
    const detailButtons = screen.getAllByText('詳細表示');
    expect(detailButtons).toHaveLength(2);
    fireEvent.click(detailButtons[0]);
  });

  it('貸出条件が表示されること', () => {
    render(<SearchResults results={mockBooks} totalCount={2} />);
    expect(screen.getByText('貸出期間: 14日')).toBeInTheDocument();
    expect(screen.getByText('送料: 500円')).toBeInTheDocument();
  });

  it('ISBN番号が正しくフォーマットされて表示されること', () => {
    render(<SearchResults results={mockBooks} totalCount={2} />);
    expect(screen.getByText('ISBN: 978-4123456789')).toBeInTheDocument();
  });
});
```