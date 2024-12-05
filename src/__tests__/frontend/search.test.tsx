```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import SearchPage from '@/pages/search';
import { useRouter } from 'next/navigation';

// モックの定義
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockSearchResults = [
  {
    id: '1',
    title: 'テスト書籍1', 
    author: 'テスト著者1',
    publisher: 'テスト出版社1',
    isbn: '1234567890'
  },
  {
    id: '2',
    title: 'テスト書籍2',
    author: 'テスト著者2', 
    publisher: 'テスト出版社2',
    isbn: '0987654321'
  }
];

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      query: {}
    }));
  });

  test('検索フォームが正しくレンダリングされる', () => {
    render(<SearchPage />);
    expect(screen.getByPlaceholderText('キーワードを入力')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
  });

  test('詳細検索オプションの表示/非表示が切り替わる', () => {
    render(<SearchPage />);
    const advancedButton = screen.getByText('詳細検索');
    fireEvent.click(advancedButton);
    expect(screen.getByLabelText('出版社')).toBeInTheDocument();
    expect(screen.getByLabelText('著者名')).toBeInTheDocument();

    fireEvent.click(advancedButton);
    expect(screen.queryByLabelText('出版社')).not.toBeInTheDocument();
  });

  test('検索実行時に正しいパラメータでAPIが呼ばれる', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: mockSearchResults }),
      } as Response)
    );

    render(<SearchPage />);
    const searchInput = screen.getByPlaceholderText('キーワードを入力');
    const searchButton = screen.getByRole('button', { name: '検索' });

    fireEvent.change(searchInput, { target: { value: 'テスト検索' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/books/search?keyword=テスト検索'),
        expect.any(Object)
      );
    });
  });

  test('検索結果が正しく表示される', async () => {
    jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: mockSearchResults }),
      } as Response)
    );

    render(<SearchPage />);
    const searchInput = screen.getByPlaceholderText('キーワードを入力');
    const searchButton = screen.getByRole('button', { name: '検索' });

    fireEvent.change(searchInput, { target: { value: 'テスト' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('テスト書籍1')).toBeInTheDocument();
      expect(screen.getByText('テスト書籍2')).toBeInTheDocument();
    });
  });

  test('検索エラー時にエラーメッセージが表示される', async () => {
    jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.reject(new Error('検索に失敗しました'))
    );

    render(<SearchPage />);
    const searchButton = screen.getByRole('button', { name: '検索' });

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('検索に失敗しました')).toBeInTheDocument();
    });
  });

  test('検索条件のクリアが正しく動作する', () => {
    render(<SearchPage />);
    const searchInput = screen.getByPlaceholderText('キーワードを入力');
    const clearButton = screen.getByRole('button', { name: 'クリア' });

    fireEvent.change(searchInput, { target: { value: 'テスト検索' } });
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
  });

  test('検索結果の並び替えが正しく動作する', async () => {
    jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: mockSearchResults }),
      } as Response)
    );

    render(<SearchPage />);
    const sortSelect = screen.getByLabelText('並び替え');

    fireEvent.change(sortSelect, { target: { value: 'title_asc' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=title_asc'),
        expect.any(Object)
      );
    });
  });

  test('ページネーションが正しく動作する', async () => {
    jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          results: mockSearchResults,
          totalPages: 3,
          currentPage: 1
        }),
      } as Response)
    );

    render(<SearchPage />);
    const nextPageButton = screen.getByRole('button', { name: '次のページ' });

    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });

  test('検索結果の詳細表示が正しく動作する', async () => {
    const mockRouter = useRouter as jest.Mock;
    render(<SearchPage />);

    const bookDetailLink = screen.getByText('テスト書籍1');
    fireEvent.click(bookDetailLink);

    expect(mockRouter().push).toHaveBeenCalledWith(
      expect.stringContaining('/books/1')
    );
  });
});
```