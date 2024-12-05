```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookForm from '@/pages/BookForm'
import '@testing-library/jest-dom'

const mockOnSubmit = jest.fn()

const defaultBook = {
  id: '1',
  isbn: '9784123456789',
  title: 'テスト本',
  author: 'テスト著者',
  publisher: 'テスト出版社',
  publishedAt: '2023-01-01',
  description: 'テストの説明文です',
  status: '利用可能'
}

describe('BookForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('新規登録時に空のフォームが表示される', () => {
    render(<BookForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText('ISBN')).toHaveValue('')
    expect(screen.getByLabelText('タイトル')).toHaveValue('')
    expect(screen.getByLabelText('著者')).toHaveValue('')
    expect(screen.getByLabelText('出版社')).toHaveValue('')
    expect(screen.getByLabelText('出版日')).toHaveValue('')
    expect(screen.getByLabelText('説明')).toHaveValue('')
  })

  it('編集時に既存の値が表示される', () => {
    render(<BookForm book={defaultBook} onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText('ISBN')).toHaveValue('9784123456789')
    expect(screen.getByLabelText('タイトル')).toHaveValue('テスト本')
    expect(screen.getByLabelText('著者')).toHaveValue('テスト著者')
    expect(screen.getByLabelText('出版社')).toHaveValue('テスト出版社')
    expect(screen.getByLabelText('出版日')).toHaveValue('2023-01-01')
    expect(screen.getByLabelText('説明')).toHaveValue('テストの説明文です')
  })

  it('必須項目が未入力の場合エラーメッセージを表示する', async () => {
    render(<BookForm onSubmit={mockOnSubmit} />)
    
    fireEvent.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(screen.getByText('ISBNは必須項目です')).toBeInTheDocument()
      expect(screen.getByText('タイトルは必須項目です')).toBeInTheDocument()
      expect(screen.getByText('著者は必須項目です')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('ISBNの形式が不正な場合エラーメッセージを表示する', async () => {
    render(<BookForm onSubmit={mockOnSubmit} />)
    
    await userEvent.type(screen.getByLabelText('ISBN'), '123456789')
    fireEvent.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(screen.getByText('ISBNの形式が不正です')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('正常な入力の場合、onSubmitが呼ばれる', async () => {
    render(<BookForm onSubmit={mockOnSubmit} />)
    
    await userEvent.type(screen.getByLabelText('ISBN'), '9784123456789')
    await userEvent.type(screen.getByLabelText('タイトル'), 'テスト本')
    await userEvent.type(screen.getByLabelText('著者'), 'テスト著者')
    await userEvent.type(screen.getByLabelText('出版社'), 'テスト出版社')
    await userEvent.type(screen.getByLabelText('出版日'), '2023-01-01')
    await userEvent.type(screen.getByLabelText('説明'), 'テストの説明文です')

    fireEvent.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        isbn: '9784123456789',
        title: 'テスト本',
        author: 'テスト著者',
        publisher: 'テスト出版社',
        publishedAt: '2023-01-01',
        description: 'テストの説明文です'
      })
    })
  })

  it('キャンセルボタンクリック時にフォームがリセットされる', async () => {
    render(<BookForm book={defaultBook} onSubmit={mockOnSubmit} />)

    await userEvent.clear(screen.getByLabelText('タイトル'))
    await userEvent.type(screen.getByLabelText('タイトル'), '新しいタイトル')

    fireEvent.click(screen.getByText('キャンセル'))

    expect(screen.getByLabelText('タイトル')).toHaveValue('テスト本')
  })

  it('ISBN検索ボタンクリック時に外部APIが呼ばれる', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        title: 'API取得タイトル',
        author: 'API取得著者',
        publisher: 'API取得出版社',
        publishedAt: '2023-02-02'
      })
    })
    global.fetch = mockFetch

    render(<BookForm onSubmit={mockOnSubmit} />)

    await userEvent.type(screen.getByLabelText('ISBN'), '9784123456789')
    fireEvent.click(screen.getByText('ISBN検索'))

    await waitFor(() => {
      expect(screen.getByLabelText('タイトル')).toHaveValue('API取得タイトル')
      expect(screen.getByLabelText('著者')).toHaveValue('API取得著者')
      expect(screen.getByLabelText('出版社')).toHaveValue('API取得出版社')
      expect(screen.getByLabelText('出版日')).toHaveValue('2023-02-02')
    })
  })

  it('ISBN検索でエラーが発生した場合エラーメッセージを表示する', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'))
    global.fetch = mockFetch

    render(<BookForm onSubmit={mockOnSubmit} />)

    await userEvent.type(screen.getByLabelText('ISBN'), '9784123456789')
    fireEvent.click(screen.getByText('ISBN検索'))

    await waitFor(() => {
      expect(screen.getByText('ISBN検索に失敗しました')).toBeInTheDocument()
    })
  })
})
```