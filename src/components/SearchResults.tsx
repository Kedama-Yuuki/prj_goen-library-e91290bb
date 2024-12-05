import React, { useState, useMemo } from 'react';
import { FiBook, FiCalendar, FiTruck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';

type BookType = {
  id: string;
  company_id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  lending_conditions: {
    lending_period: number;
    shipping_fee: number;
  };
  status: string;
};

type SearchResultsProps = {
  results: BookType[];
  totalCount: number;
};

const SearchResults: React.FC<SearchResultsProps> = ({ results, totalCount }) => {
  const [sortOrder, setSortOrder] = useState('title_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedResults = useMemo(() => {
    const sorted = [...results];
    switch (sortOrder) {
      case 'title_asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title_desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'author_asc':
        return sorted.sort((a, b) => a.author.localeCompare(b.author));
      case 'author_desc':
        return sorted.sort((a, b) => b.author.localeCompare(a.author));
      default:
        return sorted;
    }
  }, [results, sortOrder]);

  const paginatedResults = sortedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const formatISBN = (isbn: string) => {
    return `${isbn.slice(0, 3)}-${isbn.slice(3)}`;
  };

  if (totalCount === 0) {
    return (
      <div className="min-h-screen h-full p-6 bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">該当する書籍が見つかりませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full p-6 bg-gray-50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">検索結果: {totalCount}件</h2>
        <div className="mt-4">
          <label htmlFor="sort" className="mr-2">ソート順:</label>
          <select
            id="sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            aria-label="ソート順"
            className="border rounded p-2"
          >
            <option value="title_asc">タイトル（昇順）</option>
            <option value="title_desc">タイトル（降順）</option>
            <option value="author_asc">著者（昇順）</option>
            <option value="author_desc">著者（降順）</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {paginatedResults.map((book) => (
          <div key={book.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{book.title}</h3>
                <p className="text-gray-600 mt-2">{book.author}</p>
                <p className="text-gray-500 mt-1">{book.publisher}</p>
                <p className="text-gray-500 mt-1">ISBN: {formatISBN(book.isbn)}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded ${
                  book.status === '貸出可能' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {book.status}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-gray-600">
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                <span>貸出期間: {book.lending_conditions.lending_period}日</span>
              </div>
              <div className="flex items-center">
                <FiTruck className="mr-2" />
                <span>送料: {book.lending_conditions.shipping_fee}円</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Link href={`/books/${book.id}`}>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                  詳細表示
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-8 flex justify-center" role="navigation">
          <ul className="flex items-center gap-2">
            <li>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-gray-200"
              >
                <FiChevronLeft />
              </button>
            </li>
            {[...Array(totalPages)].map((_, index) => (
              <li key={index + 1}>
                <button
                  onClick={() => setCurrentPage(index + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    currentPage === index + 1 ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-gray-200"
              >
                <FiChevronRight />
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default SearchResults;