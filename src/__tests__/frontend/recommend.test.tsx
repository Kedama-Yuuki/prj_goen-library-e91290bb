```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Recommend from '@/pages/recommend';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import axios from 'axios';

// モックコンポーネント
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>;
  };
});

jest.mock('@/components/RecommendList', () => {
  return function MockRecommendList({ recommendations, category }) {
    return (
      <div data-testid="mock-recommend-list">
        カテゴリー: {category}
        {recommendations.map((book) => (
          <div key={book.id}>{book.title}</div>
        ))}
      </div>
    );
  };
});

const mockRecommendations = {
  business: [
    { id: 1, title: "ビジネス書1" },
    { id: 2, title: "ビジネス書2" }
  ],
  technology: [
    { id: 3, title: "技術書1" },
    { id: 4, title: "技術書2" }
  ]
};

describe('Recommend画面', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockRecommendations });
  });

  test('初期表示時にレコメンドデータを取得して表示する', async () => {
    render(<Recommend />);

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/recommend');
      expect(screen.getByTestId('mock-recommend-list')).toBeInTheDocument();
    });
  });

  test('カテゴリー切り替えが正常に動作する', async () => {
    render(<Recommend />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-recommend-list')).toBeInTheDocument();
    });

    const technologyTab = screen.getByRole('tab', { name: '技術書' });
    fireEvent.click(technologyTab);

    await waitFor(() => {
      expect(screen.getByText('技術書1')).toBeInTheDocument();
      expect(screen.getByText('技術書2')).toBeInTheDocument();
    });
  });

  test('エラー発生時にエラーメッセージを表示する', async () => {
    axios.get.mockRejectedValueOnce(new Error('APIエラー'));
    
    render(<Recommend />);

    await waitFor(() => {
      expect(screen.getByText('レコメンドデータの取得に失敗しました')).toBeInTheDocument();
    });
  });

  test('ローディング状態が表示される', () => {
    render(<Recommend />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  test('書籍詳細へのリンクが機能する', async () => {
    render(<Recommend />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-recommend-list')).toBeInTheDocument();
    });

    const bookLink = screen.getByText('ビジネス書1');
    fireEvent.click(bookLink);

    expect(global.mockNextRouter.push).toHaveBeenCalledWith('/books/1');
  });
});
```