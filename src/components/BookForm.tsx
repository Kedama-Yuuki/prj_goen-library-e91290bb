import { useState, useEffect } from 'react'
import { FiSearch, FiSave, FiX } from 'react-icons/fi'
import { supabase } from '@/utils/supabase'

type BookType = {
  id?: string
  isbn: string
  title: string
  author: string
  publisher: string
  publishedAt: string
  description: string
  status?: string
}

type BookFormProps = {
  book?: BookType
  onSubmit: (book: BookType) => void
}

const BookForm = ({ book, onSubmit }: BookFormProps) => {
  const [formData, setFormData] = useState<BookType>({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publishedAt: '',
    description: '',
    status: '利用可能'
  })

  const [errors, setErrors] = useState<Partial<BookType>>({})
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    if (book) {
      setFormData(book)
    }
  }, [book])

  const validateForm = () => {
    const newErrors: Partial<BookType> = {}
    
    if (!formData.isbn) {
      newErrors.isbn = 'ISBNは必須項目です'
    } else if (!/^\d{13}$/.test(formData.isbn)) {
      newErrors.isbn = 'ISBNの形式が不正です'
    }
    
    if (!formData.title) newErrors.title = 'タイトルは必須項目です'
    if (!formData.author) newErrors.author = '著者は必須項目です'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleReset = () => {
    if (book) {
      setFormData(book)
    } else {
      setFormData({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        publishedAt: '',
        description: '',
        status: '利用可能'
      })
    }
    setErrors({})
  }

  const searchISBN = async () => {
    setIsSearching(true)
    setSearchError('')
    try {
      const response = await fetch(`https://api.example.com/books/${formData.isbn}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          title: data.title,
          author: data.author,
          publisher: data.publisher,
          publishedAt: data.publishedAt
        }))
      } else {
        setSearchError('ISBN検索に失敗しました')
      }
    } catch (error) {
      setSearchError('ISBN検索に失敗しました')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">ISBN</label>
            <div className="flex gap-2">
              <input
                id="isbn"
                type="text"
                value={formData.isbn}
                onChange={e => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={searchISBN}
                disabled={isSearching}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                <FiSearch className="w-5 h-5" />
                ISBN検索
              </button>
            </div>
            {errors.isbn && <p className="mt-1 text-sm text-red-600">{errors.isbn}</p>}
            {searchError && <p className="mt-1 text-sm text-red-600">{searchError}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">タイトル</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700">著者</label>
          <input
            id="author"
            type="text"
            value={formData.author}
            onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author}</p>}
        </div>

        <div>
          <label htmlFor="publisher" className="block text-sm font-medium text-gray-700">出版社</label>
          <input
            id="publisher"
            type="text"
            value={formData.publisher}
            onChange={e => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-700">出版日</label>
          <input
            id="publishedAt"
            type="date"
            value={formData.publishedAt}
            onChange={e => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">説明</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2"
          >
            <FiX className="w-5 h-5" />
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
          >
            <FiSave className="w-5 h-5" />
            保存
          </button>
        </div>
      </div>
    </form>
  )
}

export default BookForm