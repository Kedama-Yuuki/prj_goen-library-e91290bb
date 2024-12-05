```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import BookDetail from '@/pages/books/[id]'
import { useRouter } from 'next/navigation'

// モックデータ
const mockBook = {
  id: '1',
  company_id: 'company1',
  isbn: '9784123456789',
  title: 'テスト書籍',
  author: 'テスト著者',
  publisher: 'テスト出版社',
  lending_conditions: {
    max_period: 14,
    renewable: true
  },
  status: '貸出可能'
}

const mockLendingHistory = [
  {
    id: 'lending1',
    book_id: '1',
    borrower_id: 'user1',
    lending_date: '2024-01-01',
    return_due_date: '2024-01-15',
    actual_return_date: '2024-01-14',
    status: '返却済'
  }
]

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>
  }
})

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="mock-sidebar">Sidebar</div>
  }
})

jest.mock('@/components/BookDetail', () => {
  return function MockBookDetail({ book, lendingHistory }) {
    return (
      <div data-testid="mock-book-detail">
        <div>Title: {book.title}</div>
        <div>貸出履歴数: {lendingHistory.length}</div>
      </div>
    )
  }
})

describe('蔵書詳細画面', () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockImplementation(() => ({
      query: { id: '1' },
      push: jest.fn()
    }))

    global.fetch = jest.fn()
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBook)
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLendingHistory)
        })
      )
  })

  it('正常に画面が表示される', async () => {
    render(<BookDetail />)

    await waitFor(() => {
      expect(screen.getByTestId('mock-header')).toBeInTheDocument()
      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('mock-book-detail')).toBeInTheDocument()
    })
  })

  it('書籍データと貸出履歴が正しく表示される', async () => {
    render(<BookDetail />)

    await waitFor(() => {
      expect(screen.getByText(`Title: ${mockBook.title}`)).toBeInTheDocument()
      expect(screen.getByText('貸出履歴数: 1')).toBeInTheDocument()
    })
  })

  it('データ取得に失敗した場合エラーメッセージが表示される', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500
      })
    )

    render(<BookDetail />)

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
    })
  })

  it('存在しない書籍IDの場合エラーメッセージが表示される', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404
      })
    )

    render(<BookDetail />)

    await waitFor(() => {
      expect(screen.getByText('指定された書籍が見つかりません')).toBeInTheDocument()
    })
  })
})
```