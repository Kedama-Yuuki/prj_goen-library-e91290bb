```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import AIMatchingOptimize from '@/pages/matching/optimize'
import '@testing-library/jest-dom'

// モックデータ
const mockMatchingResults = [
  {
    id: '1',
    companyName: 'テスト企業A',
    matchScore: 0.95,
    recommendedBooks: [
      { id: '1', title: 'テスト書籍1', author: '著者1' },
      { id: '2', title: 'テスト書籍2', author: '著者2' }
    ]
  },
  {
    id: '2', 
    companyName: 'テスト企業B',
    matchScore: 0.85,
    recommendedBooks: [
      { id: '3', title: 'テスト書籍3', author: '著者3' }
    ]
  }
]

// APIモック
jest.mock('axios')
const mockAxios = jest.mocked(axios)

describe('AIMatchingOptimize', () => {
  beforeEach(() => {
    mockAxios.get.mockReset()
    mockAxios.post.mockReset()
  })

  test('画面の初期表示が正しく行われる', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: mockMatchingResults })

    render(<AIMatchingOptimize />)

    expect(screen.getByText('AIマッチング最適化')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'マッチング分析実行' })).toBeInTheDocument()
    expect(screen.getByLabelText('条件設定')).toBeInTheDocument()
  })

  test('マッチング分析を実行して結果が表示される', async () => {
    mockAxios.post.mockResolvedValueOnce({ data: mockMatchingResults })

    render(<AIMatchingOptimize />)

    const analyzeButton = screen.getByRole('button', { name: 'マッチング分析実行' })
    fireEvent.click(analyzeButton)

    await waitFor(() => {
      expect(screen.getByText('テスト企業A')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('テスト書籍1')).toBeInTheDocument()
    })
  })

  test('エラー時にエラーメッセージが表示される', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('API Error'))

    render(<AIMatchingOptimize />)

    const analyzeButton = screen.getByRole('button', { name: 'マッチング分析実行' })
    fireEvent.click(analyzeButton)

    await waitFor(() => {
      expect(screen.getByText('分析中にエラーが発生しました')).toBeInTheDocument()
    })
  })

  test('条件設定の変更が正しく反映される', () => {
    render(<AIMatchingOptimize />)

    const minScoreInput = screen.getByLabelText('最低適合度')
    fireEvent.change(minScoreInput, { target: { value: '0.8' } })

    const maxResultsInput = screen.getByLabelText('表示件数')
    fireEvent.change(maxResultsInput, { target: { value: '10' } })

    expect(minScoreInput).toHaveValue('0.8')
    expect(maxResultsInput).toHaveValue('10')
  })

  test('詳細表示ボタンをクリックすると詳細が表示される', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: mockMatchingResults })

    render(<AIMatchingOptimize />)

    const detailButton = screen.getByRole('button', { name: '詳細を表示' })
    fireEvent.click(detailButton)

    await waitFor(() => {
      expect(screen.getByText('推奨書籍一覧')).toBeInTheDocument()
      expect(screen.getByText('テスト書籍1')).toBeInTheDocument()
      expect(screen.getByText('著者1')).toBeInTheDocument()
    })
  })

  test('ソート機能が正しく動作する', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: mockMatchingResults })

    render(<AIMatchingOptimize />)

    const sortSelect = screen.getByLabelText('ソート順')
    fireEvent.change(sortSelect, { target: { value: 'score_desc' } })

    await waitFor(() => {
      const companies = screen.getAllByTestId('company-name')
      expect(companies[0]).toHaveTextContent('テスト企業A')
      expect(companies[1]).toHaveTextContent('テスト企業B')
    })
  })

  test('フィルター機能が正しく動作する', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: mockMatchingResults })

    render(<AIMatchingOptimize />)

    const filterInput = screen.getByLabelText('企業名フィルター')
    fireEvent.change(filterInput, { target: { value: 'テスト企業A' } })

    await waitFor(() => {
      expect(screen.getByText('テスト企業A')).toBeInTheDocument()
      expect(screen.queryByText('テスト企業B')).not.toBeInTheDocument()
    })
  })

  test('ページネーションが正しく動作する', async () => {
    mockAxios.get.mockResolvedValueOnce({ 
      data: {
        results: mockMatchingResults,
        totalPages: 2,
        currentPage: 1
      }
    })

    render(<AIMatchingOptimize />)

    const nextPageButton = screen.getByRole('button', { name: '次のページ' })
    fireEvent.click(nextPageButton)

    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('page=2')
    )
  })
})
```