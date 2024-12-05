```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/pages/LoginForm';
import '@testing-library/jest-dom';

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログインフォームが正しくレンダリングされること', () => {
    render(<LoginForm onSubmit={mockOnSubmit} error="" />);
    
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
  });

  it('バリデーションエラーが表示されること', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} error="" />);
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await userEvent.click(submitButton);

    expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
    expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument();
  });

  it('メールアドレスの形式バリデーションが機能すること', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} error="" />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    await userEvent.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await userEvent.click(submitButton);

    expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
  });

  it('パスワードの最小文字数バリデーションが機能すること', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} error="" />);
    
    const passwordInput = screen.getByLabelText('パスワード');
    await userEvent.type(passwordInput, '123');
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await userEvent.click(submitButton);

    expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument();
  });

  it('フォームの送信が正しく動作すること', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} error="" />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('エラーメッセージが表示されること', () => {
    const errorMessage = 'ログインに失敗しました';
    render(<LoginForm onSubmit={mockOnSubmit} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('パスワードの表示/非表示の切り替えが機能すること', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} error="" />);
    
    const passwordInput = screen.getByLabelText('パスワード');
    const toggleButton = screen.getByRole('button', { name: 'パスワードを表示' });

    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('入力中のローディング状態が適切に表示されること', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} error="" />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    await userEvent.type(emailInput, 'test@example.com');

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('フォーム送信時にボタンが非活性になること', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} error="" />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
```