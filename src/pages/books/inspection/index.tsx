import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { IoBarcode, IoBook, IoCheckmark, IoWarning } from 'react-icons/io5';
import { supabase } from '@/supabase';
import Link from 'next/link';

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

type InspectionHistory = {
  date: string;
  count: number;
};

export default function BookInspection() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('inspection');
  const [history, setHistory] = useState<InspectionHistory[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*');

      if (error) throw error;

      setBooks(data || []);
      setFilteredBooks(data || []);
    } catch (err) {
      setError('エラーが発生しました');
      // フォールバックデータ
      const fallbackData = [
        {
          id: '1',
          title: 'テスト書籍1',
          isbn: '9784123456789',
          status: '良好',
          company_id: '1',
          author: '著者1',
          publisher: '出版社1',
          lending_conditions: {}
        },
        {
          id: '2',
          title: 'テスト書籍2',
          isbn: '9784987654321',
          status: '要確認',
          company_id: '1',
          author: '著者2',
          publisher: '出版社2',
          lending_conditions: {}
        }
      ];
      setBooks(fallbackData);
      setFilteredBooks(fallbackData);
    }
  };

  useEffect(() => {
    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery)
    );
    setFilteredBooks(filtered);
  }, [searchQuery, books]);

  const handleBarcodeSubmit = async () => {
    const book = books.find(b => b.isbn === barcodeInput);
    if (book) {
      setSelectedBook(book);
    }
    setBarcodeInput('');
  };

  const handleStatusUpdate = async () => {
    if (!selectedBook || !newStatus) return;

    try {
      const { error } = await supabase
        .from('books')
        .update({ status: newStatus })
        .eq('id', selectedBook.id);

      if (error) throw error;

      setBooks(books.map(book =>
        book.id === selectedBook.id ? { ...book, status: newStatus } : book
      ));
      setSelectedBook(null);
      setNewStatus('');
    } catch (err) {
      setError('状態の更新に失敗しました');
    }
  };

  const handleComplete = () => {
    setShowComplete(true);
  };

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="flex">
        {/* サイドバー */}
        <div className="w-64 min-h-screen bg-[#2C4F7C] p-4">
          <div className="text-white text-xl font-bold mb-8">ライブラリー管理</div>
          <nav className="space-y-2">
            <Link href="/books" className="flex items-center text-white p-2 rounded hover:bg-[#4A90E2]">
              <IoBook className="mr-2" />
              蔵書一覧
            </Link>
            <Link href="/books/inspection" className="flex items-center text-white p-2 rounded bg-[#4A90E2]">
              <IoCheckmark className="mr-2" />
              蔵書点検
            </Link>
          </nav>
        </div>

        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">蔵書点検</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex mb-4">
              <button
                className={`mr-4 px-4 py-2 rounded ${
                  activeTab === 'inspection' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setActiveTab('inspection')}
              >
                点検実施
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setActiveTab('history')}
              >
                点検履歴
              </button>
            </div>

            {activeTab === 'inspection' ? (
              <>
                <div className="mb-6">
                  <div className="flex space-x-4 mb-4">
                    <input
                      type="text"
                      placeholder="書籍を検索"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 p-2 border rounded"
                    />
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="バーコードをスキャンまたは入力"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                      <IoBarcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                    </div>
                    <button
                      onClick={handleBarcodeSubmit}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      読み取り
                    </button>
                  </div>

                  {selectedBook && (
                    <div className="bg-gray-50 p-4 rounded mb-4">
                      <h3 className="font-bold mb-2">{selectedBook.title}</h3>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <span className="mr-2">状態:</span>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="p-2 border rounded"
                          >
                            <option value="">選択してください</option>
                            <option value="良好">良好</option>
                            <option value="要確認">要確認</option>
                            <option value="破損">破損</option>
                            <option value="紛失">紛失</option>
                          </select>
                        </label>
                        <button
                          onClick={handleStatusUpdate}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-6 py-3 text-left">タイトル</th>
                          <th className="px-6 py-3 text-left">ISBN</th>
                          <th className="px-6 py-3 text-left">状態</th>
                          <th className="px-6 py-3 text-left">アクション</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBooks.map((book) => (
                          <tr key={book.id} className="border-t">
                            <td className="px-6 py-4">{book.title}</td>
                            <td className="px-6 py-4">{book.isbn}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded ${
                                  book.status === '良好'
                                    ? 'bg-green-100 text-green-800'
                                    : book.status === '要確認'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {book.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setSelectedBook(book)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                点検
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleComplete}
                      className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                    >
                      点検完了
                    </button>
                  </div>

                  {showComplete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="bg-white p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">点検が完了しました</h3>
                        <p className="mb-4">総点検冊数: {books.length}冊</p>
                        <button
                          onClick={() => setShowComplete(false)}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          閉じる
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-4">点検履歴</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>2023-12-01</span>
                    <span>点検数: 100冊</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>2023-11-01</span>
                    <span>点検数: 95冊</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}