import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { FaBook, FaHistory, FaEdit, FaTrash } from 'react-icons/fa'
import Link from 'next/link'
import { supabase } from '@/supabase'

const BookDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const [book, setBook] = useState(null)
  const [lendingHistory, setLendingHistory] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchBookData()
    }
  }, [id])

  const fetchBookData = async () => {
    try {
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (bookError) throw bookError

      if (!bookData) {
        setError('指定された書籍が見つかりません')
        return
      }

      const { data: lendingData, error: lendingError } = await supabase
        .from('lending_records')
        .select('*')
        .eq('book_id', id)

      if (lendingError) throw lendingError

      setBook(bookData)
      setLendingHistory(lendingData)
    } catch (err) {
      setError('データの取得に失敗しました')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen h-full bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-red-500 text-center">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white shadow-md h-screen fixed">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-800">Menu</h2>
            <nav className="mt-6">
              <Link href="/books" className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded">
                <FaBook className="mr-3" />
                蔵書一覧
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 ml-64 p-8">
          {book && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{book.title}</h1>
                <div className="space-x-4">
                  <Link href={`/books/${id}/edit`} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    <FaEdit className="mr-2" />
                    編集
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">書籍情報</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600">ISBN</p>
                      <p className="font-medium">{book.isbn}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">著者</p>
                      <p className="font-medium">{book.author}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">出版社</p>
                      <p className="font-medium">{book.publisher}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">状態</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        book.status === '貸出可能' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {book.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">貸出条件</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600">最大貸出期間</p>
                      <p className="font-medium">{book.lending_conditions.max_period}日</p>
                    </div>
                    <div>
                      <p className="text-gray-600">更新可否</p>
                      <p className="font-medium">{book.lending_conditions.renewable ? '可能' : '不可'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">貸出履歴</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          貸出日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          返却期限
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          実際の返却日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状態
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lendingHistory.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(record.lending_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(record.return_due_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.actual_return_date 
                              ? new Date(record.actual_return_date).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.status === '返却済' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default BookDetail