```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BooksIndex from '@/pages/books/index';
import '@testing-library/jest-dom';
import { mockBooks } from '@/tests/mocks/bookData';

jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">ヘッダー</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">サイドバー</div>;
  };
});

describe('蔵書一覧画面', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ books: mockBooks }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('初期表示時に蔵書一覧が表示される', async () => {
    render(<BooksIndex />);

    await waitFor(() => {
      expect(screen.getByTestId('book-list')).toBeInTheDocument();
    });

    mockBooks.forEach((book) => {
      expect(screen.getByText(book.title)).toBeInTheDocument();
    });
  });

  it('検索フィルターが正常に動作する', async () => {
    render(<BooksIndex />);

    const searchInput = screen.getByPlaceholderText('書籍タイトルで検索');
    await userEvent.type(searchInput, 'テスト書籍');

    const searchButton = screen.getByRole('button', { name: '検索' });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?title=テスト書籍')
      );
    });
  });

  it('ソート機能が正常に動作する', async () => {
    render(<BooksIndex />);

    const sortSelect = screen.getByLabelText('並び替え');
    await userEvent.selectOptions(sortSelect, 'title_asc');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?sort=title_asc')
      );
    });
  });

  it('ページネーションが正常に動作する', async () => {
    render(<BooksIndex />);

    const nextPageButton = screen.getByRole('button', { name: '次のページ' });
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('詳細画面への遷移リンクが機能する', async () => {
    render(<BooksIndex />);

    await waitFor(() => {
      expect(screen.getByTestId('book-list')).toBeInTheDocument();
    });

    const firstBookLink = screen.getByTestId(`book-link-${mockBooks[0].id}`);
    fireEvent.click(firstBookLink);

    expect(global.mockNextRouter.push).toHaveBeenCalledWith(
      `/books/${mockBooks[0].id}`
    );
  });

  it('エラー時にエラーメッセージが表示される', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    ) as jest.Mock;

    render(<BooksIndex />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('ローディング状態が表示される', () => {
    render(<BooksIndex />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```