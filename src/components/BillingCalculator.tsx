import { useState, useEffect, useMemo } from 'react';
import { FaFileDownload, FaEye, FaCalculator } from 'react-icons/fa';
import { supabase } from '@/supabase';
import Topbar from '@/components/Topbar';
import dayjs from 'dayjs';

type LendingType = {
  id: string;
  bookId: string;
  borrowerId: string;
  lendingDate: string;
  returnDueDate: string;
  actualReturnDate: string | null;
  status: string;
};

type ShippingType = {
  id: string;
  lendingRecordId: string;
  type: string;
  trackingNumber: string;
  status: string;
};

type Props = {
  lendingRecords: LendingType[];
  shippingRecords: ShippingType[];
};

const BillingCalculator = ({ lendingRecords, shippingRecords }: Props) => {
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string>('');

  const calculateLendingFee = (record: LendingType) => {
    const baseFee = 1000;
    const days = dayjs(record.actualReturnDate || record.returnDueDate).diff(dayjs(record.lendingDate), 'day');
    return baseFee * Math.max(1, days);
  };

  const calculateShippingFee = (record: ShippingType) => {
    return record.type === '発送' ? 800 : 800;
  };

  const filteredCalculations = useMemo(() => {
    const filtered = lendingRecords.filter(record => {
      const date = dayjs(record.lendingDate);
      return date.isAfter(startDate) && date.isBefore(endDate);
    });

    const totalLendingFee = filtered.reduce((sum, record) => sum + calculateLendingFee(record), 0);
    const totalShippingFee = shippingRecords.reduce((sum, record) => sum + calculateShippingFee(record), 0);

    return {
      lendingFee: totalLendingFee,
      shippingFee: totalShippingFee,
      total: totalLendingFee + totalShippingFee
    };
  }, [lendingRecords, shippingRecords, startDate, endDate]);

  const handleDownloadCSV = () => {
    const csvContent = `貸出料金,${filteredCalculations.lendingFee}
配送料金,${filteredCalculations.shippingFee}
合計金額,${filteredCalculations.total}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '請求明細.csv';
    link.click();
  };

  useEffect(() => {
    if (lendingRecords.some(record => record.status === 'エラー')) {
      setError('計算エラーが発生しました');
    }
  }, [lendingRecords]);

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">料金計算</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">開始日</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">終了日</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {}}
              className="mt-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <FaCalculator />
              再計算
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">貸出料金</h2>
              <p data-testid="total-lending-fee" className="text-2xl font-bold">
                {filteredCalculations.lendingFee.toLocaleString()}円
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">配送料金</h2>
              <p data-testid="total-shipping-fee" className="text-2xl font-bold">
                {filteredCalculations.shippingFee.toLocaleString()}円
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">合計金額</h2>
            <p data-testid="total-amount" className="text-3xl font-bold text-blue-600">
              {filteredCalculations.total.toLocaleString()}円
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <FaEye />
            請求書プレビュー
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            <FaFileDownload />
            明細ダウンロード
          </button>
        </div>

        {showPreview && (
          <div data-testid="invoice-preview" className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">請求書プレビュー</h2>
            <div className="space-y-2">
              <p>請求書番号: INV-{dayjs().format('YYYYMMDD')}-001</p>
              <p>請求日: {dayjs().format('YYYY年MM月DD日')}</p>
              {/* その他の請求書詳細情報 */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingCalculator;