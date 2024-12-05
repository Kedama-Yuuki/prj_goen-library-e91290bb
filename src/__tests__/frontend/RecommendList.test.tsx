```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecommendList from '@/pages/RecommendList';

const mockRecommendations = [
  {
    id: '1',
    title: 'テスト書籍1',
    author: 'テスト著者1',
    publisher: 'テスト出版社1',
    isbn: '1234567890123',
    category: 'ビジネス',
    coverImage: '/images/test1.jpg',
    description: 'テスト説明文1'
  },
  {
    id: '2', 
    title: 'テスト書籍2',
    author: 'テスト著者2',
    publisher: 'テスト出版社2',
    isbn: '1234567890124',
    category: 'IT',
    coverImage: '/images/test2.jpg',
    description: 'テスト説明文2'
  }
];

describe('RecommendList', () => {
  const mockProps = {
    recommendations: mockRecommendations,
    category: 'ビジネス'
  };

  it('コンポーネントが正しくレンダリングされること', () => {
    render(<RecommendList {...mockProps} />);
    
    expect(screen.getByText('おすすめ書籍')).toBeInTheDocument();
    expect(screen.getByText('カテゴリー: ビジネス')).toBeInTheDocument();
  });

  it('書籍リストが正しく表示されること', () => {
    render(<RecommendList {...mockProps} />);

    mockRecommendations.forEach(book => {
      expect(screen.getByText(book.title)).toBeInTheDocument();
      expect(screen.getByText(book.author)).toBeInTheDocument();
      expect(screen.getByAltText(`${book.title}の表紙`)).toHaveAttribute('src', book.coverImage);
    });
  });

  it('書籍がクリックされたときに詳細モーダルが表示されること', async () => {
    render(<RecommendList {...mockProps} />);
    
    const firstBook = screen.getByText(mockRecommendations[0].title);
    await userEvent.click(firstBook);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(mockRecommendations[0].description)).toBeInTheDocument();
  });

  it('空の推薦リストの場合、適切なメッセージが表示されること', () => {
    render(<RecommendList recommendations={[]} category="ビジネス" />);
    
    expect(screen.getByText('現在のカテゴリーではおすすめ書籍がありません')).toBeInTheDocument();
  });

  it('ソート機能が正しく動作すること', async () => {
    render(<RecommendList {...mockProps} />);
    
    const sortSelect = screen.getByLabelText('並び替え');
    await userEvent.selectOptions(sortSelect, '著者名');
    
    const bookTitles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(bookTitles).toEqual(['テスト書籍1', 'テスト書籍2']);
  });

  it('フィルター機能が正しく動作すること', async () => {
    render(<RecommendList {...mockProps} />);
    
    const filterInput = screen.getByPlaceholderText('書籍を検索');
    await userEvent.type(filterInput, 'テスト書籍1');
    
    expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
    expect(screen.queryByText('テスト書籍2')).not.toBeInTheDocument();
  });

  it('詳細モーダルが閉じられること', async () => {
    render(<RecommendList {...mockProps} />);
    
    const firstBook = screen.getByText(mockRecommendations[0].title);
    await userEvent.click(firstBook);
    
    const closeButton = screen.getByRole('button', { name: '閉じる' });
    await userEvent.click(closeButton);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('画像読み込みエラー時の代替表示が機能すること', () => {
    render(<RecommendList {...mockProps} />);
    
    const bookImage = screen.getAllByRole('img')[0];
    fireEvent.error(bookImage);
    
    expect(screen.getByAltText('画像読み込みエラー')).toBeInTheDocument();
  });
});
```