import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { FiDollarSign, FiClock, FiSettings, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function PaymentManage() {
  const [payments, setPayments] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [bankSettings, setBankSettings] = useState({
    bankName: 'テスト銀行',
    branchCode: '001',
    accountNumber: '1234567',
    accountType: '普通'
  });
  const [activeTab, setActiveTab] = useState('payments');

  useEffect(() => {
    fetchPayments();
    fetchBankSettings();
  }, [searchTerm, statusFilter, currentPage]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_records')
        .select('*')
        .ilike('company_id', `%${searchTerm}%`)
        .eq(statusFilter !== 'all' ? 'status' : '', statusFilter)
        .range((currentPage - 1) * 10, currentPage * 10 - 1);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('支払データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankSettings = async () => {
    // 実際のAPIでは銀行設定を取得する処理を実装
  };

  const handleProcessPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_records')
        .update({ status: '処理済' })
        .in('id', selectedPayments);

      if (error) throw error;
      toast.success('支払処理が完了しました');
      fetchPayments();
      setSelectedPayments([]);
    } catch (error) {
      console.error('Error processing payments:', error);
      toast.error('支払処理に失敗しました');
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">支払管理</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'payments' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                支払一覧
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded ${
                  activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
                role="tab"
              >
                支払履歴
              </button>
            </div>
          </div>

          <div className="mb-6 flex justify-between items-center">
            <div className="flex space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="企業名で検索"
                  className="pl-10 pr-4 py-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
              <select
                className="border rounded-md px-4 py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="支払状況"
              >
                <option value="all">全て</option>
                <option value="未処理">未処理</option>
                <option value="処理済">処理済</option>
              </select>
            </div>
            <button
              onClick={handleProcessPayments}
              disabled={selectedPayments.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-md disabled:opacity-50"
            >
              支払処理実行
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayments(payments.map((p) => p.id));
                        } else {
                          setSelectedPayments([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    企業ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払期限
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPayments([...selectedPayments, payment.id]);
                          } else {
                            setSelectedPayments(selectedPayments.filter((id) => id !== payment.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{payment.company_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">¥{payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded ${
                        payment.status === '未処理' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(payment.billing_month).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div>
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md mr-2"
              >
                前のページ
              </button>
              <button
                onClick={() => setCurrentPage(page => page + 1)}
                className="px-4 py-2 border rounded-md"
                aria-label="次のページ"
              >
                次のページ
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'payments' && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">振込設定</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">銀行名</p>
                <p className="font-medium">{bankSettings.bankName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">支店コード</p>
                <p className="font-medium">{bankSettings.branchCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">口座番号</p>
                <p className="font-medium">{bankSettings.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">口座種別</p>
                <p className="font-medium">{bankSettings.accountType}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}