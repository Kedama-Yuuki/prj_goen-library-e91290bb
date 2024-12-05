```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import Sidebar from '@/pages/Sidebar';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

describe('Sidebar', () => {
  const mockRouter = {
    push: jest.fn()
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('管理者ロールで全てのメニューが表示される', () => {
    render(<Sidebar userRole="admin" activeMenu="dashboard" />);
    
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('蔵書管理')).toBeInTheDocument();
    expect(screen.getByText('貸出管理')).toBeInTheDocument();
    expect(screen.getByText('配送管理')).toBeInTheDocument();
    expect(screen.getByText('決済管理')).toBeInTheDocument();
  });

  it('一般ユーザーロールで制限されたメニューが表示される', () => {
    render(<Sidebar userRole="user" activeMenu="dashboard" />);
    
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('蔵書検索')).toBeInTheDocument();
    expect(screen.getByText('貸出履歴')).toBeInTheDocument();
    expect(screen.queryByText('決済管理')).not.toBeInTheDocument();
  });

  it('アクティブなメニューがハイライトされる', () => {
    render(<Sidebar userRole="user" activeMenu="books" />);
    
    const activeMenuItem = screen.getByText('蔵書検索').closest('li');
    expect(activeMenuItem).toHaveClass('active');
  });

  it('メニュークリックで正しいルーティングが実行される', () => {
    render(<Sidebar userRole="user" activeMenu="dashboard" />);
    
    fireEvent.click(screen.getByText('蔵書検索'));
    expect(mockRouter.push).toHaveBeenCalledWith('/books');
  });

  it('アコーディオンメニューの開閉動作', () => {
    render(<Sidebar userRole="admin" activeMenu="settings" />);
    
    const settingsMenu = screen.getByText('設定');
    fireEvent.click(settingsMenu);

    expect(screen.getByText('プロフィール設定')).toBeVisible();
    expect(screen.getByText('システム設定')).toBeVisible();

    fireEvent.click(settingsMenu);
    expect(screen.queryByText('プロフィール設定')).not.toBeVisible();
  });

  it('レスポンシブ表示切り替えが機能する', () => {
    render(<Sidebar userRole="user" activeMenu="dashboard" />);
    
    const toggleButton = screen.getByRole('button', { name: 'メニュー切り替え' });
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('sidebar-container')).toHaveClass('collapsed');
  });

  it('エラー時のフォールバックUIが表示される', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<Sidebar userRole="invalid" activeMenu="dashboard" />);
    
    expect(screen.getByText('メニューの読み込みに失敗しました')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument();
    
    consoleError.mockRestore();
  });

  it('ツールチップが正しく表示される', async () => {
    render(<Sidebar userRole="user" activeMenu="dashboard" />);
    
    const helpIcon = screen.getByTestId('help-icon');
    fireEvent.mouseOver(helpIcon);

    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('ヘルプ');
  });

  it('検索フィルターが機能する', () => {
    render(<Sidebar userRole="admin" activeMenu="dashboard" />);
    
    const searchInput = screen.getByPlaceholderText('メニュー検索');
    fireEvent.change(searchInput, { target: { value: '蔵書' } });

    expect(screen.getByText('蔵書管理')).toBeInTheDocument();
    expect(screen.queryByText('決済管理')).not.toBeInTheDocument();
  });
});
```