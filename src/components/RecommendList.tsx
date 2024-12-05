import { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaSort, FaSearch } from 'react-icons/fa';
import Image from 'next/image';
import { supabase } from '@/supabase';

type BookType = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  category: string;
  coverImage: string;
  description: string;
};

type RecommendListProps = {
  recommendations: BookType[];
  category: string;
};

export default function RecommendList({ recommendations, category }: RecommendListProps) {
  const [books, setBooks] = useState<BookType[]>(recommendations);
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('title');
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const filteredBooks = recommendations.filter(
      book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedBooks = [...filteredBooks].sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        default:
          return 0;
      }
    });

    setBooks(sortedBooks);
  }, [recommendations, searchQuery, sortOption]);

  const handleBookClick = (book: BookType) => {
    setSelectedBook(book);
  };

  const handleCloseModal = () => {
    setSelectedBook(null);
  };

  const handleImageError = (bookId: string) => {
    setImageError(prev => ({ ...prev, [bookId]: true }));
  };

  return (
    <div className="min-h-screen h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">おすすめ書籍</h1>
            <p className="text-gray-600 mt-2">カテゴリー: {category}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="書籍を検索"
                className="pl-10 pr-4 py-2 border rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-gray-600">並び替え</label>
              <select
                id="sort"
                className="border rounded-lg py-2 px-4"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="title">タイトル</option>
                <option value="author">著者名</option>
              </select>
            </div>
          </div>
        </div>

        {books.length === 0 ? (
          <p className="text-center text-gray-600 py-10">現在のカテゴリーではおすすめ書籍がありません</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition hover:scale-105"
                onClick={() => handleBookClick(book)}
              >
                <div className="aspect-w-3 aspect-h-4 relative h-48">
                  {imageError[book.id] ? (
                    <div className="flex items-center justify-center bg-gray-200 w-full h-full">
                      <span className="text-gray-500">画像読み込みエラー</span>
                    </div>
                  ) : (
                    <Image
                      src={book.coverImage}
                      alt={`${book.title}の表紙`}
                      layout="fill"
                      objectFit="cover"
                      onError={() => handleImageError(book.id)}
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{book.title}</h3>
                  <p className="text-gray-600">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedBook.title}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="閉じる"
                >
                  <IoClose size={24} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative h-64">
                  <Image
                    src={selectedBook.coverImage}
                    alt={`${selectedBook.title}の表紙`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <p className="text-gray-600 mb-2">著者: {selectedBook.author}</p>
                  <p className="text-gray-600 mb-2">出版社: {selectedBook.publisher}</p>
                  <p className="text-gray-600 mb-2">ISBN: {selectedBook.isbn}</p>
                  <p className="text-gray-600 mb-4">カテゴリー: {selectedBook.category}</p>
                  <p className="text-gray-800">{selectedBook.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}