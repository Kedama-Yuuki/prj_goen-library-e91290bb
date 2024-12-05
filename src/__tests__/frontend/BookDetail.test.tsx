```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookDetail from '@/pages/BookDetail';
import { useRouter } from 'next/navigation';

// 型定義
type BookType = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  status: string;
  lendingConditions: {
    lendingPeriod: number;
    restrictedCompanies?: string[];
  };
};

type LendingType = {
  id: string;
  borrowerId: string;
  borrowerName: string;
  lendingDate: string;
  returnDueDate: string;
  actualReturnDate?: string;
  status: string;
};

// モックデータ
const mockBook: BookType = {
  id: '1',
  title: 'テスト書籍',
  author: 'テスト著者',
  publisher: 'テスト出版社',
  isbn: '9784123456789',
  status: '貸出可能',
  lendingConditions: {
    lendingPeriod: 14,
  }
};

const mockLendingHistory: LendingType[] = [
  {
    id: '1',
    borrowerId: 'user1',
    borrowerName: '貸出者1',
    lendingDate: '2024-01-01',
    returnDueDate: '2024-01-15',
    actualReturnDate: '2024-01-14',
    status: '返却済'
  },
  {
    id: '2',
    borrowerId: 'user2',
    borrowerName: '貸出者2', 
    lendingDate: '2024-02-01',
    returnDueDate: '2024-02-15',
    status: '貸出中'
  }
];

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

describe('BookDetail', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      back: jest.fn()
    }));
  });

  it('書籍の基本情報が正しく表示される', () => {
    render(<BookDetail book={mockBook} lendingHistory={[]} />);

    expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    expect(screen.getByText('テスト著者')).toBeInTheDocument();
    expect(screen.getByText('テスト出版社')).toBeInTheDocument();
    expect(screen.getByText('9784123456789')).toBeInTheDocument();
    expect(screen.getByText('貸出可能')).toBeInTheDocument();
  });

  it('貸出履歴が正しく表示される', () => {
    render(<BookDetail book={mockBook} lendingHistory={mockLendingHistory} />);

    expect(screen.getByText('貸出者1')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('2024-01-14')).toBeInTheDocument();
    expect(screen.getByText('返却済')).toBeInTheDocument();

    expect(screen.getByText('貸出者2')).toBeInTheDocument();
    expect(screen.getByText('2024-02-01')).toBeInTheDocument();
    expect(screen.getByText('貸出中')).toBeInTheDocument();
  });

  it('編集ボタンをクリックすると編集画面に遷移する', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush
    }));

    render(<BookDetail book={mockBook} lendingHistory={mockLendingHistory} />);

    const editButton = screen.getByText('編集');
    await userEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith(`/books/${mockBook.id}/edit`);
  });

  it('戻るボタンをクリックすると前の画面に戻る', async () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      back: mockBack
    }));

    render(<BookDetail book={mockBook} lendingHistory={mockLendingHistory} />);

    const backButton = screen.getByText('戻る');
    await userEvent.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('貸出条件が正しく表示される', () => {
    render(<BookDetail book={mockBook} lendingHistory={mockLendingHistory} />);

    expect(screen.getByText('14日間')).toBeInTheDocument();
  });

  it('制限付き企業がある場合に表示される', () => {
    const bookWithRestrictions = {
      ...mockBook,
      lendingConditions: {
        ...mockBook.lendingConditions,
        restrictedCompanies: ['企業A', '企業B']
      }
    };

    render(<BookDetail book={bookWithRestrictions} lendingHistory={mockLendingHistory} />);

    expect(screen.getByText('企業A')).toBeInTheDocument();
    expect(screen.getByText('企業B')).toBeInTheDocument();
  });

  it('貸出履歴が空の場合適切なメッセージが表示される', () => {
    render(<BookDetail book={mockBook} lendingHistory={[]} />);

    expect(screen.getByText('貸出履歴はありません')).toBeInTheDocument();
  });

  it('ISBNコードから書籍情報を取得できる', async () => {
    render(<BookDetail book={mockBook} lendingHistory={mockLendingHistory} />);

    const isbnButton = screen.getByText('ISBN情報取得');
    await userEvent.click(isbnButton);

    await waitFor(() => {
      expect(screen.getByText('ISBN情報を更新しました')).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージが表示される', async () => {
    global.fetch = jest.fn(() => 
      Promise.reject('API Error')
    );

    render(<BookDetail book={mockBook} lendingHistory={mockLendingHistory} />);

    const isbnButton = screen.getByText('ISBN情報取得');
    await userEvent.click(isbnButton);

    await waitFor(() => {
      expect(screen.getByText('ISBN情報の取得に失敗しました')).toBeInTheDocument();
    });
  });
});
```