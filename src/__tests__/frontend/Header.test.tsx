```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import Header from '@/pages/Header';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

const mockUser = {
  id: '1',
  name: 'テストユーザー',
  email: 'test@example.com',
  role: 'ADMIN'
};

describe('Headerコンポーネント', () => {
  beforeEach(() => {
    global.mockNextRouter.push.mockClear();
  });

  it('ログイン状態でユーザー情報が表示される', () => {
    render(<Header user={mockUser} isLoggedIn={true} />);
    
    expect(screen.getByText('テストユーザー')).toBeInTheDocument();
    expect(screen.getByAltText('ビジネスライブラリーコネクトロゴ')).toBeInTheDocument();
  });

  it('未ログイン状態でログインボタンが表示される', () => {
    render(<Header user={null} isLoggedIn={false} />);
    
    expect(screen.getByText('ログイン')).toBeInTheDocument();
    expect(screen.queryByText('テストユーザー')).not.toBeInTheDocument();
  });

  it('ナビゲーションメニューが正しく表示される', () => {
    render(<Header user={mockUser} isLoggedIn={true} />);
    
    expect(screen.getByText('蔵書管理')).toBeInTheDocument();
    expect(screen.getByText('検索')).toBeInTheDocument();
    expect(screen.getByText('貸出管理')).toBeInTheDocument();
  });

  it('ユーザーメニューの開閉が動作する', async () => {
    render(<Header user={mockUser} isLoggedIn={true} />);
    
    const userMenuButton = screen.getByLabelText('ユーザーメニュー');
    await userEvent.click(userMenuButton);
    
    expect(screen.getByText('プロフィール')).toBeInTheDocument();
    expect(screen.getByText('ログアウト')).toBeInTheDocument();
  });

  it('ログアウトボタンクリックで確認ダイアログが表示される', async () => {
    render(<Header user={mockUser} isLoggedIn={true} />);
    
    const userMenuButton = screen.getByLabelText('ユーザーメニュー');
    await userEvent.click(userMenuButton);
    
    const logoutButton = screen.getByText('ログアウト');
    await userEvent.click(logoutButton);
    
    expect(screen.getByText('ログアウトしますか？')).toBeInTheDocument();
  });

  it('通知アイコンクリックで通知パネルが表示される', async () => {
    render(<Header user={mockUser} isLoggedIn={true} />);
    
    const notificationButton = screen.getByLabelText('通知');
    await userEvent.click(notificationButton);
    
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
  });

  it('ロゴクリックでホームページに遷移する', async () => {
    render(<Header user={mockUser} isLoggedIn={true} />);
    
    const logo = screen.getByAltText('ビジネスライブラリーコネクトロゴ');
    await userEvent.click(logo);
    
    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/');
  });

  it('レスポンシブメニューが動作する', async () => {
    render(<Header user={mockUser} isLoggedIn={true} />);
    
    const menuButton = screen.getByLabelText('メニュー');
    await userEvent.click(menuButton);
    
    expect(screen.getByTestId('mobile-menu')).toHaveClass('active');
  });

  it('検索ボックスが動作する', async () => {
    render(<Header user={mockUser} isLoggedIn={true} />);
    
    const searchInput = screen.getByPlaceholderText('書籍を検索...');
    await userEvent.type(searchInput, 'テスト書籍');
    
    expect(searchInput).toHaveValue('テスト書籍');
  });
});
```