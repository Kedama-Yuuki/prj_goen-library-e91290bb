```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Login from '@/pages/login';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('ログイン画面', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ログインフォームが表示される', () => {
    render(<Login />);
    
    expect(screen.getByLabelText('企業ID')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
  });

  it('バリデーションエラーが表示される', async () => {
    render(<Login />);
    
    const loginButton = screen.getByRole('button', { name: 'ログイン' });
    
    await act(async () => {
      fireEvent.click(loginButton);
    });

    expect(screen.getByText('企業IDを入力してください')).toBeInTheDocument();
    expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument();
  });

  it('ログイン成功時にダッシュボードへ遷移する', async () => {
    render(<Login />);

    const companyIdInput = screen.getByLabelText('企業ID');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(companyIdInput, { target: { value: 'test-company' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'fake-token' }),
      })
    ) as jest.Mock;

    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('ログイン失敗時にエラーメッセージが表示される', async () => {
    render(<Login />);

    const companyIdInput = screen.getByLabelText('企業ID');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(companyIdInput, { target: { value: 'wrong-company' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: '認証に失敗しました' }),
      })
    ) as jest.Mock;

    await act(async () => {
      fireEvent.click(loginButton);
    });

    expect(screen.getByText('認証に失敗しました')).toBeInTheDocument();
  });

  it('パスワードの表示/非表示を切り替えできる', () => {
    render(<Login />);
    
    const passwordInput = screen.getByLabelText('パスワード');
    const toggleButton = screen.getByRole('button', { name: 'パスワードを表示' });

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('入力フィールドの値が正しく更新される', () => {
    render(<Login />);
    
    const companyIdInput = screen.getByLabelText('企業ID');
    const passwordInput = screen.getByLabelText('パスワード');

    fireEvent.change(companyIdInput, { target: { value: 'test-company' } });
    fireEvent.change(passwordInput, { target: { value: 'test-password' } });

    expect(companyIdInput).toHaveValue('test-company');
    expect(passwordInput).toHaveValue('test-password');
  });

  it('ログイン中の状態が表示される', async () => {
    render(<Login />);

    const companyIdInput = screen.getByLabelText('企業ID');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(companyIdInput, { target: { value: 'test-company' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    global.fetch = jest.fn(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'fake-token' }),
      }), 100))
    ) as jest.Mock;

    fireEvent.click(loginButton);

    expect(screen.getByText('ログイン中...')).toBeInTheDocument();
  });
});
```