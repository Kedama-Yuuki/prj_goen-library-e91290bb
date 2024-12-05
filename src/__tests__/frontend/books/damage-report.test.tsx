```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DamageReport from '@/pages/books/damage-report';
import { act } from 'react-dom/test-utils';

// モックの定義
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

const mockBook = {
  id: '1',
  title: 'テスト書籍',
  status: '貸出中'
};

const mockUploadImage = jest.fn();
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} onClick={() => mockUploadImage(props.src)} />;
  },
}));

describe('DamageReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ book: mockBook })
      })
    );
  });

  it('正しくレンダリングされること', async () => {
    render(<DamageReport />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByText('破損・紛失報告')).toBeInTheDocument();
  });

  it('書籍選択が機能すること', async () => {
    render(<DamageReport />);
    
    const bookSelect = screen.getByLabelText('対象書籍');
    await act(async () => {
      await userEvent.selectOptions(bookSelect, '1');
    });
    
    expect(bookSelect).toHaveValue('1');
  });

  it('状態選択が機能すること', async () => {
    render(<DamageReport />);
    
    const statusSelect = screen.getByLabelText('状態');
    await act(async () => {
      await userEvent.selectOptions(statusSelect, '破損');
    });
    
    expect(statusSelect).toHaveValue('破損');
  });

  it('詳細入力が機能すること', async () => {
    render(<DamageReport />);
    
    const detailsInput = screen.getByLabelText('詳細');
    await act(async () => {
      await userEvent.type(detailsInput, 'テスト詳細');
    });
    
    expect(detailsInput).toHaveValue('テスト詳細');
  });

  it('画像アップロードが機能すること', async () => {
    render(<DamageReport />);
    
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText('画像アップロード');
    
    await act(async () => {
      await userEvent.upload(input, file);
    });
    
    expect(input.files[0]).toStrictEqual(file);
  });

  it('フォーム送信が機能すること', async () => {
    const mockFetch = global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    render(<DamageReport />);

    await act(async () => {
      await userEvent.selectOptions(screen.getByLabelText('対象書籍'), '1');
      await userEvent.selectOptions(screen.getByLabelText('状態'), '破損');
      await userEvent.type(screen.getByLabelText('詳細'), 'テスト詳細');
      await userEvent.upload(
        screen.getByLabelText('画像アップロード'),
        new File(['test'], 'test.png', { type: 'image/png' })
      );
    });

    const submitButton = screen.getByRole('button', { name: '報告する' });
    await act(async () => {
      await userEvent.click(submitButton);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      })
    );
  });

  it('エラー時にエラーメッセージが表示されること', async () => {
    global.fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('エラーが発生しました'))
    );

    render(<DamageReport />);

    const submitButton = screen.getByRole('button', { name: '報告する' });
    await act(async () => {
      await userEvent.click(submitButton);
    });

    expect(await screen.findByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('送信成功時に完了メッセージが表示されること', async () => {
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    render(<DamageReport />);

    const submitButton = screen.getByRole('button', { name: '報告する' });
    await act(async () => {
      await userEvent.click(submitButton);
    });

    expect(await screen.findByText('報告が完了しました')).toBeInTheDocument();
  });

  it('必須フィールドが空の場合にバリデーションエラーが表示されること', async () => {
    render(<DamageReport />);

    const submitButton = screen.getByRole('button', { name: '報告する' });
    await act(async () => {
      await userEvent.click(submitButton);
    });

    expect(screen.getByText('対象書籍を選択してください')).toBeInTheDocument();
    expect(screen.getByText('状態を選択してください')).toBeInTheDocument();
    expect(screen.getByText('詳細を入力してください')).toBeInTheDocument();
  });
});
```