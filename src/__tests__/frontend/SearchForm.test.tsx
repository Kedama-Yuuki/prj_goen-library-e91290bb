```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchForm from '@/pages/SearchForm';

describe('SearchForm', () => {
  const mockOnSearch = jest.fn();
  const defaultProps = {
    onSearch: mockOnSearch,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態で検索フォームが表示される', () => {
    render(<SearchForm {...defaultProps} />);
    
    expect(screen.getByRole('textbox', { name: 'キーワード' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '検索カテゴリ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
  });

  it('デフォルト値が正しく設定される', () => {
    const defaultValues = {
      keyword: 'テスト',
      category: '書籍',
      author: '著者名',
      publisher: '出版社'
    };

    render(<SearchForm {...defaultProps} defaultValues={defaultValues} />);
    
    expect(screen.getByRole('textbox', { name: 'キーワード' })).toHaveValue('テスト');
    expect(screen.getByRole('combobox', { name: '検索カテゴリ' })).toHaveValue('書籍');
    expect(screen.getByRole('textbox', { name: '著者' })).toHaveValue('著者名');
    expect(screen.getByRole('textbox', { name: '出版社' })).toHaveValue('出版社');
  });

  it('フォーム入力値が変更できる', async () => {
    render(<SearchForm {...defaultProps} />);

    const keywordInput = screen.getByRole('textbox', { name: 'キーワード' });
    const categorySelect = screen.getByRole('combobox', { name: '検索カテゴリ' });
    const authorInput = screen.getByRole('textbox', { name: '著者' });
    const publisherInput = screen.getByRole('textbox', { name: '出版社' });

    await userEvent.type(keywordInput, 'プログラミング');
    await userEvent.selectOptions(categorySelect, '技術書');
    await userEvent.type(authorInput, '山田太郎');
    await userEvent.type(publisherInput, '技術出版社');

    expect(keywordInput).toHaveValue('プログラミング');
    expect(categorySelect).toHaveValue('技術書');
    expect(authorInput).toHaveValue('山田太郎');
    expect(publisherInput).toHaveValue('技術出版社');
  });

  it('検索ボタンクリックで入力値が送信される', async () => {
    render(<SearchForm {...defaultProps} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'キーワード' }), 'テスト');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: '検索カテゴリ' }), '書籍');
    await userEvent.type(screen.getByRole('textbox', { name: '著者' }), '著者名');
    await userEvent.type(screen.getByRole('textbox', { name: '出版社' }), '出版社');

    await userEvent.click(screen.getByRole('button', { name: '検索' }));

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith({
      keyword: 'テスト',
      category: '書籍',
      author: '著者名',
      publisher: '出版社'
    });
  });

  it('必須フィールドが空の場合にエラーメッセージを表示する', async () => {
    render(<SearchForm {...defaultProps} />);

    await userEvent.clear(screen.getByRole('textbox', { name: 'キーワード' }));
    await userEvent.click(screen.getByRole('button', { name: '検索' }));

    expect(screen.getByText('キーワードは必須です')).toBeInTheDocument();
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('フォームリセットボタンで入力値がクリアされる', async () => {
    render(<SearchForm {...defaultProps} />);

    const keywordInput = screen.getByRole('textbox', { name: 'キーワード' });
    await userEvent.type(keywordInput, 'テスト');
    
    await userEvent.click(screen.getByRole('button', { name: 'リセット' }));

    expect(keywordInput).toHaveValue('');
    expect(screen.getByRole('combobox', { name: '検索カテゴリ' })).toHaveValue('');
  });

  it('フォーム送信中はボタンが無効化される', async () => {
    mockOnSearch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(<SearchForm {...defaultProps} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'キーワード' }), 'テスト');
    await userEvent.click(screen.getByRole('button', { name: '検索' }));

    expect(screen.getByRole('button', { name: '検索中...' })).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '検索' })).toBeEnabled();
    });
  });

  it('検索履歴が表示・選択できる', async () => {
    const mockHistory = ['過去の検索1', '過去の検索2'];
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockHistory));
    
    render(<SearchForm {...defaultProps} />);
    
    await userEvent.click(screen.getByRole('textbox', { name: 'キーワード' }));
    
    const historyItems = screen.getAllByRole('option');
    expect(historyItems).toHaveLength(2);
    expect(historyItems[0]).toHaveTextContent('過去の検索1');
    
    await userEvent.click(historyItems[0]);
    expect(screen.getByRole('textbox', { name: 'キーワード' })).toHaveValue('過去の検索1');
  });
});
```