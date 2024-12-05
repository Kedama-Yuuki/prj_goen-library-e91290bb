import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import Link from 'next/link';
import { FiBell, FiSettings, FiMail, FiCheck, FiSearch, FiCalendar } from 'react-icons/fi';
import { format, isPast, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import axios from 'axios';

type LendingRecord = {
  id: string;
  book_id: string;
  borrower_id: string;
  lending_date: string;
  return_due_date: string;
  actual_return_date: string | null;
  status: string;
  book: {
    title: string;
  };
  borrower: {
    name: string;
  };
};

export default function ReturnNotifications() {
  const [records, setRecords] = useState<LendingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailNotification, setEmailNotification] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('lending_records')
        .select(`
          *,
          book:books(title),
          borrower:companies(name)
        `)
        .is('actual_return_date', null)
        .order('return_due_date', { ascending: true });

      if (error) throw error;

      setRecords(data || []);
      setLoading(false);
    } catch (err) {
      setError('データの取得に失敗しました');
      setRecords([
        {
          id: '1',
          book_id: 'book-1',
          borrower_id: 'user-1',
          lending_date: '2024-01-01',
          return_due_date: '2024-02-01',
          actual_return_date: null,
          status: '貸出中',
          book: { title: 'テスト書籍1' },
          borrower: { name: 'テストユーザー1' }
        },
        {
          id: '2',
          book_id: 'book-2',
          borrower_id: 'user-2',
          lending_date: '2024-01-15',
          return_due_date: '2024-02-15',
          actual_return_date: null,
          status: '貸出中',
          book: { title: 'テスト書籍2' },
          borrower: { name: 'テストユーザー2' }
        }
      ]);
      setLoading(false);
    }
  };

  const handleNotificationSettingsChange = async () => {
    try {
      await axios.post('/api/notifications/settings', {
        emailEnabled: !emailNotification
      });
      setEmailNotification(!emailNotification);
    } catch (err) {
      setError('設定の更新に失敗しました');
    }
  };

  const handleSendReminders = async () => {
    try {
      await axios.post('/api/returns/remind', {
        lendingIds: selectedIds
      });
      setShowNotificationModal(false);
      fetchRecords();
    } catch (err) {
      setError('催促送信に失敗しました');
    }
  };

  const handleBulkProcess = async () => {
    try {
      await axios.post('/api/returns/bulk', {
        lendingIds: selectedIds,
        action: 'remind'
      });
      setShowBulkModal(false);
      fetchRecords();
    } catch (err) {
      setError('一括処理に失敗しました');
    }
  };

  const filteredRecords = records.filter(record =>
    record.book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">返却通知一覧</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowNotificationModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiBell className="mr-2" />
                通知設定
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <FiCheck className="mr-2" />
                  一括処理
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="書籍名で検索"
                className="w-full px-4 py-2 border rounded-md pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-8 p-4">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(records.map(r => r.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    書籍名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    借り手
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    返却期限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} role="row">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, record.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== record.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.book.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.borrower.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(record.return_due_date), 'yyyy/MM/dd', { locale: ja })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        isPast(new Date(record.return_due_date))
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedIds([record.id]);
                          setShowNotificationModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        催促送信
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">通知設定</h2>
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={emailNotification}
                  onChange={handleNotificationSettingsChange}
                  aria-label="メール通知"
                />
                <span>メール通知を有効にする</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleSendReminders}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                送信する
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">一括処理</h2>
            <p className="mb-4">選択した{selectedIds.length}件の貸出に対して処理を実行しますか？</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleBulkProcess}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                処理実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}