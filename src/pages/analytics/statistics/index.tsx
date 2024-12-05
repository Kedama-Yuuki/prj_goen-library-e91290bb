import { useEffect, useState } from 'react'
import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { FiDownload, FiRefreshCw } from 'react-icons/fi'
import { BiBook, BiTime, BiLibrary } from 'react-icons/bi'
import { supabase } from '@/supabase'
import axios from 'axios'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

type AnalyticsData = {
  lendingStats: {
    totalLending: number
    averageDuration: number
    topGenres: string[]
    monthlyTrends: { month: string; count: number }[]
  }
  bookStats: {
    totalBooks: number
    activeBooks: number
    popularBooks: { id: number; title: string; lendCount: number }[]
  }
}

const Statistics: NextPage = () => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/analytics/generate-report', {
        params: { startDate, endDate }
      })
      setAnalyticsData(response.data)
      setError('')
    } catch (err) {
      setError('データの読み込みに失敗しました')
      // フォールバックデータ
      setAnalyticsData({
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
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const exportReport = () => {
    // レポート出力処理
    console.log('レポート出力')
  }

  if (loading) {
    return (
      <div className="min-h-screen h-full bg-gray-50 p-8">
        <div className="text-center">データを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Head>
        <title>利用統計分析 | ビジネスライブラリーコネクト</title>
      </Head>

      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">利用統計分析</h1>
          
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <h2 className="text-lg font-semibold mb-4">分析期間設定</h2>
            <div className="flex gap-4 mb-4">
              <div>
                <label htmlFor="startDate" className="block text-sm text-gray-600">開始日</label>
                <input
                  type="date"
                  id="startDate"
                  aria-label="開始日"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm text-gray-600">終了日</label>
                <input
                  type="date"
                  id="endDate"
                  aria-label="終了日"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchAnalyticsData}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                <FiRefreshCw className="mr-2" />
                データ更新
              </button>
              <button
                onClick={exportReport}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <FiDownload className="mr-2" />
                レポート出力
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {analyticsData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <BiBook className="text-2xl text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold">総貸出数</h3>
                  </div>
                  <p className="text-3xl font-bold">{analyticsData.lendingStats.totalLending}件</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <BiTime className="text-2xl text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold">平均貸出期間</h3>
                  </div>
                  <p className="text-3xl font-bold">{analyticsData.lendingStats.averageDuration}日</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <BiLibrary className="text-2xl text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold">登録書籍数</h3>
                  </div>
                  <p className="text-3xl font-bold">{analyticsData.bookStats.totalBooks}冊</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">月別貸出推移</h3>
                  <div data-testid="monthly-trend-chart">
                    <Line
                      data={{
                        labels: analyticsData.lendingStats.monthlyTrends.map(trend => trend.month),
                        datasets: [{
                          label: '貸出数',
                          data: analyticsData.lendingStats.monthlyTrends.map(trend => trend.count),
                          borderColor: '#4A90E2',
                          tension: 0.1
                        }]
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">ジャンル分布</h3>
                  <div data-testid="genre-distribution-chart">
                    <Doughnut
                      data={{
                        labels: analyticsData.lendingStats.topGenres,
                        datasets: [{
                          data: [45, 30, 25],
                          backgroundColor: ['#4A90E2', '#50C878', '#FFB6C1']
                        }]
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">人気書籍</h3>
                <div data-testid="popular-books-chart">
                  <Bar
                    data={{
                      labels: analyticsData.bookStats.popularBooks.map(book => book.title),
                      datasets: [{
                        label: '貸出回数',
                        data: analyticsData.bookStats.popularBooks.map(book => book.lendCount),
                        backgroundColor: '#4A90E2'
                      }]
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Statistics