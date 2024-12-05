```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RequestPage from '@/pages/books/[id]/request';
import { useRouter } from 'next/navigation';

// モックデータ
const mockBook = {
  id: '123',
  title: 'テスト書籍',
  author: 'テスト著者',
  publisher: 'テスト出版社',
  lending_conditions: {
    maxLendingDays: 14,
    shippingFee: 500
  }
};

const mockUser = {
  id: 'user123',
  name: '田中太郎',
  company: {
    id: 'company123',
    name: 'テスト株式会社',
    address: {
      postalCode: '123-4567',
      prefecture: '東京都',
      city: '渋谷区',
      street: '1-1-1'
    }
  }
};

// モック関数
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false
  })
}));

describe('貸出リクエスト画面', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      query: { id: '123' }
    }));

    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBook),
      })
    );
  });

  it('画面の初期表示が正しく行われる', async () => {
    await act(async () => {
      render(<RequestPage />);
    });

    expect(screen.getByText('貸出リクエスト')).toBeInTheDocument();
    expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    expect(screen.getByText(`著者：${mockBook.author}`)).toBeInTheDocument();
  });

  it('必須項目が未入力の場合、エラーメッセージが表示される', async () => {
    await act(async () => {
      render(<RequestPage />);
    });

    const submitButton = screen.getByRole('button', { name: 'リクエストを送信' });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('利用目的を入力してください')).toBeInTheDocument();
    expect(screen.getByText('利用期間を選択してください')).toBeInTheDocument();
  });

  it('正しく入力された場合、リクエストが送信される', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<RequestPage />);
    });

    await user.type(screen.getByLabelText('利用目的'), '研究のため必要');
    await user.type(screen.getByLabelText('利用開始日'), '2024-03-01');
    await user.type(screen.getByLabelText('利用終了日'), '2024-03-14');

    const mockPost = jest.fn().mockResolvedValueOnce({ ok: true });
    global.fetch = mockPost;

    const submitButton = screen.getByRole('button', { name: 'リクエストを送信' });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/api/lending-requests',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('研究のため必要')
      })
    );
  });

  it('配送先情報の入力フォームが正しく動作する', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<RequestPage />);
    });

    const useDefaultAddressCheckbox = screen.getByRole('checkbox', { name: '会社所在地を使用' });
    
    await user.click(useDefaultAddressCheckbox);
    
    expect(screen.getByDisplayValue(mockUser.company.address.postalCode)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.company.address.prefecture)).toBeInTheDocument();
  });

  it('利用条件の表示と確認チェックが正しく動作する', async () => {
    await act(async () => {
      render(<RequestPage />);
    });

    expect(screen.getByText(`最大貸出期間：${mockBook.lending_conditions.maxLendingDays}日間`)).toBeInTheDocument();
    expect(screen.getByText(`配送料：${mockBook.lending_conditions.shippingFee}円`)).toBeInTheDocument();

    const termsCheckbox = screen.getByRole('checkbox', { name: '利用条件に同意する' });
    expect(termsCheckbox).not.toBeChecked();

    await act(async () => {
      fireEvent.click(termsCheckbox);
    });

    expect(termsCheckbox).toBeChecked();
  });

  it('APIエラー時のエラーメッセージが表示される', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    await act(async () => {
      render(<RequestPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });
});
```