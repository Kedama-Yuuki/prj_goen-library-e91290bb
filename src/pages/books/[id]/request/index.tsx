import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { FaBook, FaCalendarAlt, FaTruck, FaCheckCircle } from 'react-icons/fa';
import { supabase } from '@/supabase';
import { format } from 'date-fns';

type Book = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  lending_conditions: {
    maxLendingDays: number;
    shippingFee: number;
  };
};

type Address = {
  postalCode: string;
  prefecture: string;
  city: string;
  street: string;
};

const RequestPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [book, setBook] = useState<Book | null>(null);
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [address, setAddress] = useState<Address>({
    postalCode: '',
    prefecture: '',
    city: '',
    street: ''
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        if (!id) return;
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setBook(data);
      } catch (error) {
        setApiError('データの取得に失敗しました');
      }
    };

    fetchBook();
  }, [id]);

  useEffect(() => {
    if (useDefaultAddress) {
      setAddress({
        postalCode: '123-4567',
        prefecture: '東京都',
        city: '渋谷区',
        street: '1-1-1'
      });
    }
  }, [useDefaultAddress]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!purpose) newErrors.purpose = '利用目的を入力してください';
    if (!startDate || !endDate) newErrors.date = '利用期間を選択してください';
    if (!agreeToTerms) newErrors.terms = '利用条件への同意が必要です';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lending_records')
        .insert([
          {
            book_id: id,
            borrower_id: 'user123',
            lending_date: startDate,
            return_due_date: endDate,
            status: 'requested'
          }
        ]);

      if (error) throw error;
      router.push('/request-complete');
    } catch (error) {
      setApiError('リクエストの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (apiError) {
    return (
      <div className="min-h-screen h-full bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <p className="text-red-600">{apiError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Head>
        <title>貸出リクエスト | ビジネスライブラリーコネクト</title>
      </Head>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">貸出リクエスト</h1>

        {book && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">{book.title}</h2>
            <p className="text-gray-600">著者：{book.author}</p>
            <p className="text-gray-600">出版社：{book.publisher}</p>
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                最大貸出期間：{book.lending_conditions.maxLendingDays}日間
              </p>
              <p className="text-sm text-gray-600">
                配送料：{book.lending_conditions.shippingFee}円
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
              利用目的
            </label>
            <textarea
              id="purpose"
              className="w-full p-2 border rounded-md"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              aria-label="利用目的"
            />
            {errors.purpose && (
              <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">利用期間</label>
            <div className="flex gap-4">
              <input
                type="date"
                className="p-2 border rounded-md"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="利用開始日"
              />
              <input
                type="date"
                className="p-2 border rounded-md"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="利用終了日"
              />
            </div>
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={useDefaultAddress}
                onChange={(e) => setUseDefaultAddress(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">会社所在地を使用</span>
            </label>

            <div className="space-y-4">
              <input
                type="text"
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                placeholder="郵便番号"
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                value={address.prefecture}
                onChange={(e) => setAddress({ ...address, prefecture: e.target.value })}
                placeholder="都道府県"
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder="市区町村"
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                placeholder="番地"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">利用条件に同意する</span>
            </label>
            {errors.terms && (
              <p className="text-red-600 text-sm mt-1">{errors.terms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? '送信中...' : 'リクエストを送信'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestPage;