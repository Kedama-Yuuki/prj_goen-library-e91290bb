```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import Statistics from '@/pages/analytics/statistics'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'

// モックデータ
const mockAnalyticsData = {
  lendingStats: {
    totalLending: 150,
    averageDuration: 14,
    topGenres: ['ビジネス', '技術', '自己啓発'],
    monthlyTrends: [
      { month: '2024-01', count: 45 },
      { month: '2024-02', count: 52 },
      { month: '2024-03', count: 53 }
    ]
  },
  bookStats: {
    totalBooks: 1000,
    activeBooks: 800,
    popularBooks: [
      { id: 1, title: '人工知能入門', lendCount: 25 },
      { id: 2, title: 'リーダーシップ論', lendCount: 20 },
      { id: 3, title: 'プロジェクトマネジメント', lendCount: 18 }
    ]
  }
}

// APIモック
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: mockAnalyticsData }))
}))

describe('Statistics画面', () => {
  beforeEach(() => {
    // ルーターモックのリセット
    const mockRouter = useRouter as jest.Mock
    mockRouter.mockImplementation(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    }))
  })

  it('統計画面が正しくレンダリングされる', async () => {
    await act(async () => {
      render(<Statistics />)
    })

    expect(screen.getByText('利用統計分析')).toBeInTheDocument()
    expect(screen.getByText('分析期間設定')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'レポート出力' })).toBeInTheDocument()
  })

  it('期間フィルターが機能する', async () => {
    await act(async () => {
      render(<Statistics />)
    })

    const startDateInput = screen.getByLabelText('開始日')
    const endDateInput = screen.getByLabelText('終了日')

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } })
    fireEvent.change(endDateInput, { target: { value: '2024-03-31' } })

    expect(startDateInput).toHaveValue('2024-01-01')
    expect(endDateInput).toHaveValue('2024-03-31')
  })

  it('統計データが正しく表示される', async () => {
    await act(async () => {
      render(<Statistics />)
    })

    await waitFor(() => {
      expect(screen.getByText('総貸出数: 150件')).toBeInTheDocument()
      expect(screen.getByText('平均貸出期間: 14日')).toBeInTheDocument()
      expect(screen.getByText('登録書籍数: 1000冊')).toBeInTheDocument()
    })
  })

  it('レポート出力ボタンのクリックイベントが機能する', async () => {
    const mockExportReport = jest.fn()

    await act(async () => {
      render(<Statistics exportReport={mockExportReport} />)
    })

    const exportButton = screen.getByRole('button', { name: 'レポート出力' })
    fireEvent.click(exportButton)

    expect(mockExportReport).toHaveBeenCalledTimes(1)
  })

  it('グラフコンポーネントが正しくレンダリングされる', async () => {
    await act(async () => {
      render(<Statistics />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('monthly-trend-chart')).toBeInTheDocument()
      expect(screen.getByTestId('genre-distribution-chart')).toBeInTheDocument()
      expect(screen.getByTestId('popular-books-chart')).toBeInTheDocument()
    })
  })

  it('エラー時のエラーメッセージが表示される', async () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    const mockAxios = require('axios')
    mockAxios.get.mockRejectedValueOnce(new Error('データの取得に失敗しました'))

    await act(async () => {
      render(<Statistics />)
    })

    await waitFor(() => {
      expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument()
    })

    mockConsoleError.mockRestore()
  })

  it('ローディング状態が正しく表示される', async () => {
    render(<Statistics />)
    
    expect(screen.getByText('データを読み込み中...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByText('データを読み込み中...')).not.toBeInTheDocument()
    })
  })

  it('データ更新ボタンが機能する', async () => {
    await act(async () => {
      render(<Statistics />)
    })

    const refreshButton = screen.getByRole('button', { name: 'データ更新' })
    fireEvent.click(refreshButton)

    const mockAxios = require('axios')
    expect(mockAxios.get).toHaveBeenCalledTimes(2) // 初期ロードと更新時
  })
})
```