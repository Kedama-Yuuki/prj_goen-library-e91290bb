import React, { useState, useEffect, useMemo } from 'react';
import { BiSort, BiSearch } from 'react-icons/bi';
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io';

type BookType = {
  id: string;
  companyId: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  lendingConditions: {
    period: number;
    fee: number;
  };
  status: string;
};

type Props = {
  books: BookType[];
  onSort: (field: string, direction?: 'asc' | 'desc') => void;
};

const BookList: React.FC<Props> = ({ books, onSort }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' | null }>({
    field: '',
    direction: null,
  });

  if (!books) {
    return (
      <div className="p-4 text-center text-red-500">
        書籍データの取得に失敗しました
      </div>
    );
  }

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.publisher.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [books, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
    onSort(field, direction);
  };

  const renderSortIcon = (field: string) => {
    if (sortConfig.field !== field) return <BiSort />;
    return sortConfig.direction === 'asc' ? <IoMdArrowDropup /> : <IoMdArrowDropdown />;
  };

  if (filteredBooks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        表示する書籍がありません
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex items-center">
          <BiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="書籍を検索..."
            className="border rounded px-3 py-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <label htmlFor="status" className="mr-2">ステータス</label>
          <select
            id="status"
            className="border rounded px-3 py-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">すべて</option>
            <option value="貸出可能">貸出可能</option>
            <option value="貸出中">貸出中</option>
          </select>
        </div>
        <div className="flex items-center">
          <label htmlFor="pageSize" className="mr-2">表示件数</label>
          <select
            id="pageSize"
            className="border rounded px-3 py-1"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={20}>20件</option>
            <option value={50}>50件</option>
            <option value={100}>100件</option>
          </select>
        </div>
        <button
          onClick={() => onSort('title')}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          タイトル順
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  タイトル {renderSortIcon('title')}
                </div>
              </th>
              <th className="px-4 py-2 text-left">著者</th>
              <th className="px-4 py-2 text-left">出版社</th>
              <th className="px-4 py-2 text-left">ISBN</th>
              <th className="px-4 py-2 text-left">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBooks.map((book) => (
              <tr key={book.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{book.title}</td>
                <td className="px-4 py-2">{book.author}</td>
                <td className="px-4 py-2">{book.publisher}</td>
                <td className="px-4 py-2">{book.isbn}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    book.status === '貸出可能' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {book.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          全{filteredBooks.length}件中 {(currentPage - 1) * pageSize + 1}-
          {Math.min(currentPage * pageSize, filteredBooks.length)}件を表示
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            前のページ
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            次のページ
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookList;