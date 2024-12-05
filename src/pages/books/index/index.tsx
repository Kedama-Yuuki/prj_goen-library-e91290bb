import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { FiSearch, FiBook, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { supabase } from '@/supabase';
import { BsArrowUpDown } from 'react-icons/bs';

type Book = {
  id: string;
  company_id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  lending_conditions: any;
  status: string;
};

const Sidebar = () => {
  const router = useRouter();
  const menuItems = [
    { name: '蔵書一覧', path: '/books', icon: <FiBook /> },
    { name: '蔵書登録', path: '/books/register', icon: <FiBook /> },
    { name: '蔵書点検', path: '/books/check', icon: <FiBook /> },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full fixed left-0 top-0 p-4">
      <div className="text-2xl font-bold text-[#2C4F7C] mb-8 p-4">
        ビジネスライブラリー
      </div>
      <nav>
        {menuItems.map((item) => (
          <Link
            href={item.path}
            key={item.path}
            className={`flex items-center p-4 rounded-lg mb-2 ${
              router.pathname === item.path
                ? 'bg-[#E6EEF8] text-[#2C4F7C]'
                : 'hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

const BooksIndex = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('title_asc');
  const itemsPerPage = 10;

  const fetchBooks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('books')
        .select('*')
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const [field, order] = sortOrder.split('_');
      query = query.order(field, { ascending: order === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      setBooks(data || []);
    } catch (err) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [currentPage, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBooks();
  };

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Head>
        <title>蔵書一覧 - ビジネスライブラリーコネクト</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64 p-8">
          <h1 className="text-2xl font-bold text-[#2C4F7C] mb-8">蔵書一覧</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleSearch} className="flex gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="書籍タイトルで検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="bg-[#4A90E2] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[#2C4F7C] transition-colors"
              >
                <FiSearch />
                検索
              </button>
            </div>

            <div className="flex justify-end mb-4">
              <label className="flex items-center gap-2">
                <span>並び替え</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="p-2 border rounded-lg"
                  aria-label="並び替え"
                >
                  <option value="title_asc">タイトル（昇順）</option>
                  <option value="title_desc">タイトル（降順）</option>
                  <option value="author_asc">著者（昇順）</option>
                  <option value="author_desc">著者（降順）</option>
                </select>
              </label>
            </div>

            {loading ? (
              <div className="flex justify-center py-8" data-testid="loading-spinner">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90E2]"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-8">{error}</div>
            ) : (
              <div data-testid="book-list">
                <div className="grid gap-4">
                  {books.map((book) => (
                    <Link
                      href={`/books/${book.id}`}
                      key={book.id}
                      data-testid={`book-link-${book.id}`}
                      className="block bg-white p-4 rounded-lg border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FiBook size={24} className="text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-[#2C4F7C]">{book.title}</h3>
                          <p className="text-gray-600">{book.author}</p>
                          <p className="text-sm text-gray-500">{book.publisher}</p>
                        </div>
                        <div className="ml-auto">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            book.status === '貸出可' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {book.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
                    aria-label="前のページ"
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="flex items-center">{currentPage}</span>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="p-2 rounded-lg border hover:bg-gray-100"
                    aria-label="次のページ"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BooksIndex;