import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/supabase';
import { FiBook, FiSearch, FiTruck, FiDollarSign } from 'react-icons/fi';
import { BiLibrary, BiBarcode } from 'react-icons/bi';
import { MdOutlineInventory2 } from 'react-icons/md';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';
import NotificationPanel from '@/components/NotificationPanel';

type Stats = {
  totalBooks: number;
  availableBooks: number;
  lendingBooks: number;
  overdueLendings: number;
};

type Notification = {
  id: number;
  message: string;
  isRead: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    availableBooks: 0,
    lendingBooks: 0,
    overdueLendings: 0
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: books, error: booksError } = await supabase
          .from('books')
          .select('status');

        const { data: lendings, error: lendingsError } = await supabase
          .from('lending_records')
          .select('status');

        if (booksError || lendingsError) throw new Error('データの取得に失敗しました');

        const lendingBooks = books?.filter(book => book.status === 'lending').length || 0;
        const totalBooks = books?.length || 0;

        setStats({
          totalBooks,
          availableBooks: totalBooks - lendingBooks,
          lendingBooks,
          overdueLendings: lendings?.filter(record => record.status === 'overdue').length || 0
        });

        setNotifications([
          { id: 1, message: '新着の蔵書が追加されました', isRead: false },
          { id: 2, message: '返却期限が近い本があります', isRead: false }
        ]);
      } catch (error) {
        setError('データの取得に失敗しました');
      }
    };

    fetchData();
  }, []);

  const quickAccessItems = [
    { icon: <BiLibrary size={24} />, title: '蔵書登録', path: '/books/register' },
    { icon: <FiSearch size={24} />, title: '蔵書検索', path: '/books/search' },
    { icon: <BiBarcode size={24} />, title: 'バーコード', path: '/books/scan' },
    { icon: <MdOutlineInventory2 size={24} />, title: '蔵書点検', path: '/books/check' },
    { icon: <FiTruck size={24} />, title: '配送管理', path: '/delivery' },
    { icon: <FiDollarSign size={24} />, title: '決済管理', path: '/billing' }
  ];

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Head>
        <title>ダッシュボード | ビジネスライブラリーコネクト</title>
      </Head>

      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h1>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">総蔵書数</h3>
              <p className="text-2xl font-bold">{stats.totalBooks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">貸出可能数</h3>
              <p className="text-2xl font-bold">{stats.availableBooks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">貸出中</h3>
              <p className="text-2xl font-bold">{stats.lendingBooks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm text-gray-500">延滞数</h3>
              <p className="text-2xl font-bold">{stats.overdueLendings}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">クイックアクセス</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {quickAccessItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {item.icon}
                    <span className="mt-2 text-sm">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">お知らせ</h2>
              <NotificationPanel notifications={notifications} />
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}