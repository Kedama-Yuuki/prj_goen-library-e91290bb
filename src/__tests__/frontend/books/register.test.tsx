```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import RegisterPage from '@/pages/books/register'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

describe('蔵書登録画面', () => {
  const mockOnSubmit = jest.fn()
  
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('初期表示時に必要なコンポーネントが表示されること', () => {
    render(<RegisterPage />)
    
    expect(screen.getByRole('heading', { name: '蔵書登録' })).toBeInTheDocument()
    expect(screen.getByRole('form')).toBeInTheDocument()
    expect(screen.getByLabelText('ISBN')).toBeInTheDocument()
    expect(screen.getByLabelText('タイトル')).toBeInTheDocument()
    expect(screen.getByLabelText('著者')).toBeInTheDocument()
    expect(screen.getByLabelText('出版社')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ISBNスキャン' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument()
  })

  it('必須項目が未入力の場合にエラーが表示されること', async () => {
    render(<RegisterPage />)
    
    const submitButton = screen.getByRole('button', { name: '登録' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('ISBNは必須です')).toBeInTheDocument()
      expect(screen.getByText('タイトルは必須です')).toBeInTheDocument()
      expect(screen.getByText('著者は必須です')).toBeInTheDocument()
      expect(screen.getByText('出版社は必須です')).toBeInTheDocument()
    })
  })

  it('正常に書籍情報が登録できること', async () => {
    const mockAxios = jest.spyOn(global.axios, 'post').mockResolvedValueOnce({
      data: { success: true }
    })

    render(<RegisterPage />)
    
    await userEvent.type(screen.getByLabelText('ISBN'), '9784123456789')
    await userEvent.type(screen.getByLabelText('タイトル'), 'テスト書籍')
    await userEvent.type(screen.getByLabelText('著者'), 'テスト著者')
    await userEvent.type(screen.getByLabelText('出版社'), 'テスト出版社')

    const submitButton = screen.getByRole('button', { name: '登録' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAxios).toHaveBeenCalledWith('/api/books', {
        isbn: '9784123456789',
        title: 'テスト書籍',
        author: 'テスト著者',
        publisher: 'テスト出版社'
      })
      expect(screen.getByText('登録が完了しました')).toBeInTheDocument()
    })
  })

  it('ISBNスキャンボタンクリック時にカメラが起動すること', async () => {
    const mockStartCamera = jest.fn()
    window.HTMLMediaElement.prototype.play = mockStartCamera

    render(<RegisterPage />)
    
    const scanButton = screen.getByRole('button', { name: 'ISBNスキャン' })
    fireEvent.click(scanButton)

    await waitFor(() => {
      expect(mockStartCamera).toHaveBeenCalled()
      expect(screen.getByTestId('camera-view')).toBeInTheDocument()
    })
  })

  it('登録エラー時にエラーメッセージが表示されること', async () => {
    jest.spyOn(global.axios, 'post').mockRejectedValueOnce(new Error('登録に失敗しました'))

    render(<RegisterPage />)
    
    await userEvent.type(screen.getByLabelText('ISBN'), '9784123456789')
    await userEvent.type(screen.getByLabelText('タイトル'), 'テスト書籍')
    await userEvent.type(screen.getByLabelText('著者'), 'テスト著者')
    await userEvent.type(screen.getByLabelText('出版社'), 'テスト出版社')

    const submitButton = screen.getByRole('button', { name: '登録' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('登録に失敗しました')).toBeInTheDocument()
    })
  })

  it('プレビューが正しく表示されること', async () => {
    render(<RegisterPage />)
    
    await userEvent.type(screen.getByLabelText('ISBN'), '9784123456789')
    await userEvent.type(screen.getByLabelText('タイトル'), 'テスト書籍')
    await userEvent.type(screen.getByLabelText('著者'), 'テスト著者')
    await userEvent.type(screen.getByLabelText('出版社'), 'テスト出版社')

    expect(screen.getByTestId('preview-isbn')).toHaveTextContent('9784123456789')
    expect(screen.getByTestId('preview-title')).toHaveTextContent('テスト書籍')
    expect(screen.getByTestId('preview-author')).toHaveTextContent('テスト著者')
    expect(screen.getByTestId('preview-publisher')).toHaveTextContent('テスト出版社')
  })

  it('書籍情報入力時にバリデーションが正しく機能すること', async () => {
    render(<RegisterPage />)

    const isbnInput = screen.getByLabelText('ISBN')
    await userEvent.type(isbnInput, '123') // 不正なISBN

    expect(screen.getByText('ISBNは13桁の数字で入力してください')).toBeInTheDocument()

    await userEvent.clear(isbnInput)
    await userEvent.type(isbnInput, '9784123456789')
    
    expect(screen.queryByText('ISBNは13桁の数字で入力してください')).not.toBeInTheDocument()
  })
})
```