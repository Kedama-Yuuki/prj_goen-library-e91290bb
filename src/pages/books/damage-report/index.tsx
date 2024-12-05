import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { FaBook, FaCamera, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '@/supabase';

export default function DamageReport() {
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([
        { id: '1', title: 'サンプル書籍1' },
        { id: '2', title: 'サンプル書籍2' }
      ]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedBook) newErrors.book = '対象書籍を選択してください';
    if (!status) newErrors.status = '状態を選択してください';
    if (!details) newErrors.details = '詳細を入力してください';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('bookId', selectedBook);
      formData.append('status', status);
      formData.append('details', details);
      if (image) formData.append('image', image);

      const { error } = await supabase
        .from('books')
        .update({ status: status })
        .eq('id', selectedBook);

      if (error) throw error;

      setSuccessMessage('報告が完了しました');
      setTimeout(() => {
        router.push('/books/list');
      }, 2000);
    } catch (error) {
      setErrorMessage('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Head>
        <title>破損・紛失報告 | ビジネスライブラリーコネクト</title>
      </Head>

      <div className="flex">
        <nav className="w-64 min-h-screen bg-white shadow-lg">
          <div className="p-4">
            <h1 className="text-xl font-bold text-[#2C4F7C]">メニュー</h1>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/books/list" className="flex items-center text-gray-600 hover:text-[#4A90E2]">
                  <FaBook className="mr-2" />
                  蔵書一覧
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-[#2C4F7C] mb-8">破損・紛失報告</h1>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow">
            <div className="mb-6">
              <label htmlFor="book" className="block text-sm font-medium text-gray-700">対象書籍</label>
              <select
                id="book"
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring-[#4A90E2]"
              >
                <option value="">選択してください</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>{book.title}</option>
                ))}
              </select>
              {errors.book && <p className="mt-1 text-sm text-red-600">{errors.book}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">状態</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring-[#4A90E2]"
              >
                <option value="">選択してください</option>
                <option value="破損">破損</option>
                <option value="紛失">紛失</option>
              </select>
              {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">詳細</label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring-[#4A90E2]"
              />
              {errors.details && <p className="mt-1 text-sm text-red-600">{errors.details}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">画像アップロード</label>
              <div className="mt-1 flex items-center">
                <label className="block">
                  <span className="sr-only">画像アップロード</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#4A90E2] file:text-white
                      hover:file:bg-[#2C4F7C]"
                  />
                </label>
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <Image
                    src={imagePreview}
                    alt="プレビュー"
                    width={200}
                    height={200}
                    className="rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#4A90E2] text-white px-6 py-2 rounded-md hover:bg-[#2C4F7C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A90E2] disabled:opacity-50"
              >
                {isSubmitting ? '送信中...' : '報告する'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}