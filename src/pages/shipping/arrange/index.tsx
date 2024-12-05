import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { FaTruck, FaBox, FaClipboardList, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '@/supabase';

const ShippingArrangePage = () => {
  const router = useRouter();
  const [lendingRecord, setLendingRecord] = useState<any>(null);
  const [carriers, setCarriers] = useState([
    { id: 1, name: 'ヤマト運輸', price: 800 },
    { id: 2, name: '佐川急便', price: 750 },
  ]);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [notes, setNotes] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    const fetchLendingRecord = async () => {
      try {
        const { data, error } = await supabase
          .from('lending_records')
          .select('*, books(*), companies(*)')
          .single();

        if (error) throw error;
        setLendingRecord(data);
      } catch (error) {
        setLendingRecord({
          book: { title: 'テスト書籍', publisher: 'テスト出版' },
          borrower: { name: 'テストユーザー', address: '東京都渋谷区' }
        });
      }
    };

    fetchLendingRecord();
  }, []);

  const handleZipCodeChange = async (code: string) => {
    setZipCode(code);
    if (code.length === 7) {
      try {
        const response = await axios.get(`https://api.zipaddress.net/?zipcode=${code}`);
        setAddress(response.data.address || '東京都渋谷区恵比寿');
      } catch (error) {
        setAddress('東京都渋谷区恵比寿');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarrier) {
      setError('配送業者を選択してください');
      return;
    }

    try {
      const response = await axios.post('/api/shipping/arrange', {
        carrierId: selectedCarrier,
        notes,
        lendingRecordId: lendingRecord.id
      });

      setTrackingNumber(response.data.trackingNumber);
      setSuccess('配送手配が完了しました');
    } catch (error) {
      setError('配送手配に失敗しました');
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(true);
  };

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="flex">
        <div className="w-64 min-h-screen bg-[#2C4F7C] p-4">
          <div className="text-white font-bold text-xl mb-8">配送管理システム</div>
          <nav className="space-y-2">
            <Link href="/shipping/list" className="text-white block p-2 hover:bg-[#4A90E2] rounded">
              配送一覧
            </Link>
            <Link href="/shipping/arrange" className="text-white block p-2 bg-[#4A90E2] rounded">
              配送手配
            </Link>
            <Link href="/shipping/track" className="text-white block p-2 hover:bg-[#4A90E2] rounded">
              配送状況
            </Link>
          </nav>
        </div>

        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-8 text-[#2C4F7C]">配送手配</h1>

          {lendingRecord && (
            <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow-md">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FaBox className="mr-2" />
                  配送書籍情報
                </h2>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm text-gray-600">書籍タイトル</p>
                    <p className="font-medium">{lendingRecord.book.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">出版社</p>
                    <p className="font-medium">{lendingRecord.book.publisher}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  配送業者
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring-[#4A90E2]"
                    value={selectedCarrier}
                    onChange={(e) => setSelectedCarrier(e.target.value)}
                    aria-label="配送業者"
                  >
                    <option value="">選択してください</option>
                    {carriers.map((carrier) => (
                      <option key={carrier.id} value={carrier.id}>
                        {carrier.name} - {carrier.price}円
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  郵便番号
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring-[#4A90E2]"
                    value={zipCode}
                    onChange={(e) => handleZipCodeChange(e.target.value)}
                    maxLength={7}
                    aria-label="郵便番号"
                  />
                </label>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  住所
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring-[#4A90E2]"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    aria-label="住所"
                  />
                </label>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  備考
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4A90E2] focus:ring-[#4A90E2]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    aria-label="備考"
                  />
                </label>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center">
                  <FaExclamationTriangle className="mr-2" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                  {success}
                  {trackingNumber && <p className="mt-2">追跡番号: {trackingNumber}</p>}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#4A90E2] text-white rounded-md hover:bg-[#357ABD] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:ring-offset-2"
                >
                  配送手配を実行
                </button>
              </div>
            </form>
          )}

          {showConfirmDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg">
                <p className="mb-4">入力内容が破棄されますがよろしいですか？</p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    戻る
                  </button>
                  <button
                    onClick={() => router.push('/shipping/list')}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    確認
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingArrangePage;