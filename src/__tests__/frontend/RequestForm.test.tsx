```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequestForm from '@/pages/RequestForm';
import '@testing-library/jest-dom';

const mockBook = {
  id: '1',
  title: 'テスト書籍',
  author: 'テスト著者',
  publisher: 'テスト出版社',
  isbn: '1234567890123',
  status: '貸出可能'
};

const mockOnSubmit = jest.fn();

describe('RequestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('フォームが正しくレンダリングされること', () => {
    render(<RequestForm book={mockBook} onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('貸出リクエスト')).toBeInTheDocument();
    expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    expect(screen.getByLabelText('利用目的')).toBeInTheDocument();
    expect(screen.getByLabelText('利用期間')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'リクエスト送信' })).toBeInTheDocument();
  });

  test('必須項目が未入力の場合にエラーが表示されること', async () => {
    render(<RequestForm book={mockBook} onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: 'リクエスト送信' });
    await userEvent.click(submitButton);

    expect(await screen.findByText('利用目的を入力してください')).toBeInTheDocument();
    expect(await screen.findByText('利用期間を選択してください')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('フォーム送信が正しく動作すること', async () => {
    render(<RequestForm book={mockBook} onSubmit={mockOnSubmit} />);
    
    await userEvent.type(screen.getByLabelText('利用目的'), '業務での参照のため');
    await userEvent.type(screen.getByLabelText('利用期間'), '2週間');
    
    const submitButton = screen.getByRole('button', { name: 'リクエスト送信' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        bookId: '1',
        purpose: '業務での参照のため',
        duration: '2週間'
      });
    });
  });

  test('利用期間の上限を超えた場合にエラーが表示されること', async () => {
    render(<RequestForm book={mockBook} onSubmit={mockOnSubmit} />);
    
    await userEvent.type(screen.getByLabelText('利用目的'), 'テスト');
    await userEvent.type(screen.getByLabelText('利用期間'), '5週間');
    
    const submitButton = screen.getByRole('button', { name: 'リクエスト送信' });
    await userEvent.click(submitButton);

    expect(await screen.findByText('利用期間は4週間以内に設定してください')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('キャンセルボタンが正しく動作すること', async () => {
    const mockHandleCancel = jest.fn();
    render(<RequestForm book={mockBook} onSubmit={mockOnSubmit} onCancel={mockHandleCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await userEvent.click(cancelButton);

    expect(mockHandleCancel).toHaveBeenCalled();
  });

  test('入力値の文字数制限が機能すること', async () => {
    render(<RequestForm book={mockBook} onSubmit={mockOnSubmit} />);
    
    const purposeInput = screen.getByLabelText('利用目的');
    const longText = 'a'.repeat(1001);
    
    await userEvent.type(purposeInput, longText);
    
    expect(purposeInput).toHaveValue(longText.slice(0, 1000));
    expect(screen.getByText('1000文字以内で入力してください')).toBeInTheDocument();
  });

  test('書籍情報が正しく表示されること', () => {
    render(<RequestForm book={mockBook} onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(`書籍名: ${mockBook.title}`)).toBeInTheDocument();
    expect(screen.getByText(`著者: ${mockBook.author}`)).toBeInTheDocument();
    expect(screen.getByText(`出版社: ${mockBook.publisher}`)).toBeInTheDocument();
    expect(screen.getByText(`ISBN: ${mockBook.isbn}`)).toBeInTheDocument();
  });

  test('読み込み中の状態が正しく表示されること', () => {
    render(<RequestForm book={mockBook} onSubmit={mockOnSubmit} isLoading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'リクエスト送信' })).toBeDisabled();
  });

  test('エラー状態が正しく表示されること', () => {
    const errorMessage = 'リクエストの送信に失敗しました';
    render(<RequestForm book={mockBook} onSubmit={mockOnSubmit} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass('error-message');
  });
});
```