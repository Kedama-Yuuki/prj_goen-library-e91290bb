import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiSearch, FiFilter, FiBook, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { supabase } from '@/supabase';

const SearchPage = () => {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [publisher, setPublisher] = useState('');
  const [author, setAuthor] = useState('');
  const [sortOption, setSortOption] = useState('title_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('books')
        .select('*')
        .order('title', { ascending: sortOption === 'title_asc' });

      if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,author.ilike.%${keyword}%`);
      }
      if (publisher) {
        query = query.ilike('publisher', `%${publisher}%`);
      }
      if (author) {
        query = query.ilike('author', `%${author}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSearchResults(data || []);
      setTotalPages(Math.ceil((data?.length || 0) / 10));
    } catch (err) {
      setError('検索に失敗しました');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch();
  };

  const clearSearch = () => {
    setKeyword('');
    setPublisher('');
    setAuthor('');
    setSearchResults([]);
    setError('');
  };

  const paginatedResults = searchResults.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">蔵書検索</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="キーワードを入力"
                className="flex-1 rounded-md border border-gray-300 px-4 py-2"
                aria-label="検索キーワード"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <FiSearch />
                検索
              </button>
              <button
                type="button"
                onClick={clearSearch}
                className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50"
              >
                クリア
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 flex items-center gap-1 mb-4"
            >
              <FiFilter />
              詳細検索
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    出版社
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    著者名
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-2"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">検索結果</h2>
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600">並び替え</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1"
                  aria-label="並び替え"
                >
                  <option value="title_asc">タイトル(昇順)</option>
                  <option value="title_desc">タイトル(降順)</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                {error}
              </div>
            )}

            {!loading && paginatedResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                検索結果がありません
              </div>
            )}

            {!loading && paginatedResults.length > 0 && (
              <div className="divide-y divide-gray-200">
                {paginatedResults.map((book) => (
                  <div
                    key={book.id}
                    className="py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                        <FiBook className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <Link
                          href={`/books/${book.id}`}
                          className="text-lg font-medium text-blue-600 hover:underline"
                        >
                          {book.title}
                        </Link>
                        <p className="text-sm text-gray-600">
                          {book.author} | {book.publisher}
                        </p>
                        <p className="text-sm text-gray-500">ISBN: {book.isbn}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  <FiChevronLeft />
                  前のページ
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  次のページ
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;