import { useEffect, useState } from 'react'
import { NextPage } from 'next'
import Link from 'next/link'
import { supabase } from '@/supabase'
import { FiBarChart2, FiSearch, FiFilter, FiChevronRight, FiChevronLeft } from 'react-icons/fi'
import { BiBookOpen } from 'react-icons/bi'
import axios from 'axios'

type MatchingResult = {
  id: string
  companyName: string
  matchScore: number
  recommendedBooks: {
    id: string
    title: string
    author: string
  }[]
}

const AIMatchingOptimize: NextPage = () => {
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [minScore, setMinScore] = useState(0.7)
  const [maxResults, setMaxResults] = useState(20)
  const [sortOrder, setSortOrder] = useState('score_desc')
  const [filter, setFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const fetchMatchingResults = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get('/api/matching/optimize', {
        params: {
          minScore,
          maxResults,
          sort: sortOrder,
          filter,
          page: currentPage
        }
      })
      setMatchingResults(response.data.results || [])
      setTotalPages(response.data.totalPages || 1)
    } catch (err) {
      setError('分析中にエラーが発生しました')
      // フォールバックデータ
      setMatchingResults([
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
      ])
    } finally {
      setLoading(false)
    }
  }

  const executeAnalysis = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.post('/api/matching/optimize', {
        minScore,
        maxResults
      })
      setMatchingResults(response.data)
    } catch (err) {
      setError('分析中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatchingResults()
  }, [currentPage, sortOrder, filter])

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">AIマッチング最適化</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="minScore" className="block text-sm font-medium text-gray-700">
                最低適合度
              </label>
              <input
                type="number"
                id="minScore"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                step="0.1"
                min="0"
                max="1"
              />
            </div>
            <div>
              <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700">
                表示件数
              </label>
              <input
                type="number"
                id="maxResults"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={executeAnalysis}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                マッチング分析実行
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
                ソート順
              </label>
              <select
                id="sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="score_desc">適合度が高い順</option>
                <option value="score_asc">適合度が低い順</option>
                <option value="company_asc">企業名昇順</option>
                <option value="company_desc">企業名降順</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
                企業名フィルター
              </label>
              <input
                type="text"
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="企業名で検索..."
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-8">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              分析中...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        企業名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        適合度
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        推奨書籍数
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matchingResults.map((result) => (
                      <tr key={result.id}>
                        <td className="px-6 py-4 whitespace-nowrap" data-testid="company-name">
                          {result.companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(result.matchScore * 100).toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {result.recommendedBooks.length}冊
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedCompany(result.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            詳細を表示
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex-1 flex justify-between">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    前のページ
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    次のページ
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {selectedCompany && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h3 className="text-lg font-medium mb-4">推奨書籍一覧</h3>
              <div className="space-y-4">
                {matchingResults
                  .find((r) => r.id === selectedCompany)
                  ?.recommendedBooks.map((book) => (
                    <div key={book.id} className="border rounded p-4">
                      <h4 className="font-medium">{book.title}</h4>
                      <p className="text-gray-600">{book.author}</p>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="mt-6 w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIMatchingOptimize