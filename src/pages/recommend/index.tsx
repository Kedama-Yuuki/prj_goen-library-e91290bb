import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/supabase';
import { FiBook, FiBookOpen, FiCoffee, FiCode, FiBarChart } from 'react-icons/fi';
import { Tab } from '@headlessui/react';

export default function Recommend() {
  const [recommendations, setRecommendations] = useState({
    business: [],
    technology: [],
    management: [],
    innovation: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('business');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('*')
        .limit(20);

      if (booksError) throw booksError;

      const categorizedBooks = {
        business: books.slice(0, 5),
        technology: books.slice(5, 10),
        management: books.slice(10, 15),
        innovation: books.slice(15, 20)
      };

      setRecommendations(categorizedBooks);
    } catch (err) {
      setError('レコメンドデータの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { name: 'business', label: 'ビジネス書', icon: FiBarChart },
    { name: 'technology', label: '技術書', icon: FiCode },
    { name: 'management', label: '経営書', icon: FiBook },
    { name: 'innovation', label: 'イノベーション', icon: FiBookOpen }
  ];

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="flex">
        <aside className="w-64 h-screen bg-white shadow-lg fixed">
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-800 mb-8">
              <FiCoffee className="inline-block mr-2" />
              Library Connect
            </div>
            <nav className="space-y-2">
              {['ホーム', '蔵書検索', 'AIレコメンド', '貸出履歴', '設定'].map((item) => (
                <Link
                  href="#"
                  key={item}
                  className="block px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 ml-64 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">AIレコメンド</h1>

          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <Tab.Group onChange={(index) => setSelectedCategory(categories[index].name)}>
              <Tab.List className="flex space-x-4 mb-8 bg-white p-1 rounded-lg shadow">
                {categories.map(({ name, label, icon: Icon }) => (
                  <Tab
                    key={name}
                    className={({ selected }) =>
                      `flex items-center px-4 py-2 rounded-lg transition-colors ${
                        selected
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Icon className="mr-2" />
                    {label}
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels>
                {categories.map(({ name }) => (
                  <Tab.Panel key={name} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations[name]?.map((book) => (
                      <Link href={`/books/${book.id}`} key={book.id}>
                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                          <div className="flex items-start space-x-4">
                            <Image
                              src="https://placehold.co/120x160"
                              alt={book.title}
                              width={120}
                              height={160}
                              className="rounded-md"
                            />
                            <div>
                              <h3 className="font-bold text-gray-800 mb-2">{book.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                              <p className="text-sm text-gray-500">{book.publisher}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
          )}
        </main>
      </div>
    </div>
  );
}