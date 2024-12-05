import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiDownload, FiMail, FiFilter, FiSearch, FiChevronDown } from 'react-icons/fi';
import { supabase } from '@/supabase';

const InvoicePage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_records')
        .select('*')
        .order('billing_month', { ascending: false });

      if (error) throw error;
      setInvoices(data);
    } catch (err) {
      setError('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      await supabase
        .from('billing_records')
        .insert([{ billing_month: selectedMonth }]);
      setShowGenerateModal(false);
      fetchInvoices();
    } catch (err) {
      setError('請求書の生成に失敗しました');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await supabase
        .from('billing_records')
        .update({ status: newStatus })
        .match({ id });
      fetchInvoices();
    } catch (err) {
      setError('ステータスの更新に失敗しました');
    }
  };

  const handleBulkMail = () => {
    alert(`${selectedInvoices.length}件のメールを送信しました`);
    setSelectedInvoices([]);
  };

  const filteredInvoices = invoices
    .filter(invoice => 
      invoice.company_id?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || invoice.status === statusFilter)
    )
    .sort((a, b) => 
      sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount
    );

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">請求書管理</h1>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            請求書発行
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex space-x-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="企業名で検索"
                  className="pl-10 pr-4 py-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <select
                  className="pl-4 pr-10 py-2 border rounded-md appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">全てのステータス</option>
                  <option value="未払い">未払い</option>
                  <option value="支払済">支払済</option>
                </select>
                <FiChevronDown className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
            {selectedInvoices.length > 0 && (
              <button
                onClick={handleBulkMail}
                className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                <FiMail />
                <span>一括処理</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(invoices.map(i => i.id));
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    請求月
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  >
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoices([...selectedInvoices, invoice.id]);
                          } else {
                            setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.billing_month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-testid="invoice-amount">
                      ¥{invoice.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          invoice.status === '未払い'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => window.URL.createObjectURL(new Blob(['dummy pdf content']))}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        PDFダウンロード
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(invoice.id, invoice.status === '未払い' ? '支払済' : '未払い')}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ステータス変更
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">請求書発行</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">請求対象月</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleGenerateInvoice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  発行する
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePage;