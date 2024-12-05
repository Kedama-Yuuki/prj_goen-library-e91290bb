import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { BiCalculator, BiSave, BiError } from 'react-icons/bi';
import { FiSidebar, FiMenu } from 'react-icons/fi';
import { supabase } from '@/supabase';

const Calculate = () => {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lendingRecords, setLendingRecords] = useState([]);
  const [shippingRecords, setShippingRecords] = useState([]);
  const [calculationResult, setCalculationResult] = useState(null);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchRecords = async () => {
    try {
      if (!startDate || !endDate) {
        setError('利用期間を入力してください');
        return;
      }

      const { data: lendingData, error: lendingError } = await supabase
        .from('lending_records')
        .select('*')
        .gte('lending_date', startDate)
        .lte('actual_return_date', endDate);

      if (lendingError) throw lendingError;

      const { data: shippingData, error: shippingError } = await supabase
        .from('shipping_records')
        .select('*')
        .in(
          'lending_record_id',
          lendingData.map(record => record.id)
        );

      if (shippingError) throw shippingError;

      setLendingRecords(lendingData);
      setShippingRecords(shippingData);
      calculateFees(lendingData, shippingData);
    } catch (error) {
      setError('データの取得に失敗しました');
    }
  };

  const calculateFees = (lending, shipping) => {
    const basicFee = 1000;
    const lendingFee = lending.length * 500;
    const shippingFee = shipping.length * 800;

    setCalculationResult({
      basicFee,
      lendingFee,
      shippingFee,
      total: basicFee + lendingFee + shippingFee
    });
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('billing_records')
        .insert({
          company_id: 'sample-company-id',
          billing_month: new Date(startDate).toISOString(),
          amount: calculationResult.total,
          details: {
            basicFee: calculationResult.basicFee,
            lendingFee: calculationResult.lendingFee,
            shippingFee: calculationResult.shippingFee,
            periodStart: startDate,
            periodEnd: endDate
          }
        });

      if (error) throw error;
    } catch (error) {
      setError('保存に失敗しました');
    }
  };

  return (
    <div className="min-h-screen h-full flex bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 bg-[#2C4F7C] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="h-full flex flex-col p-4 text-white">
          <h2 className="text-xl font-bold mb-8">ビジネスライブラリー</h2>
          <nav className="flex-1">
            <Link href="/billing/calculate" className="block py-2 px-4 rounded hover:bg-[#4A90E2]">
              料金計算
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <FiMenu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-[#2C4F7C]">料金計算</h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
                <BiError className="mr-2" />
                {error}
              </div>
            )}

            {/* 計算フォーム */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    利用期間（開始）
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    利用期間（終了）
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
              </div>
              <button
                onClick={fetchRecords}
                className="w-full bg-[#4A90E2] text-white py-2 px-4 rounded-md hover:bg-[#2C4F7C] transition-colors flex items-center justify-center"
              >
                <BiCalculator className="mr-2" />
                計算実行
              </button>
            </div>

            {/* 計算結果 */}
            {calculationResult && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold mb-4">明細</h2>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span>基本料金</span>
                    <span>¥{calculationResult.basicFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>貸出料金</span>
                    <span>¥{calculationResult.lendingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>配送料金</span>
                    <span>¥{calculationResult.shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-lg">
                    <span>合計金額</span>
                    <span>¥{calculationResult.total.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  className="mt-6 w-full bg-[#2C4F7C] text-white py-2 px-4 rounded-md hover:bg-[#4A90E2] transition-colors flex items-center justify-center"
                >
                  <BiSave className="mr-2" />
                  保存
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Calculate;