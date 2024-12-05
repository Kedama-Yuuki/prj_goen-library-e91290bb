import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BiPackage, BiRefresh, BiMap, BiHistory } from 'react-icons/bi';
import { FiTruck } from 'react-icons/fi';
import { MdLocationOn } from 'react-icons/md';
import { supabase } from '@/supabase';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/TrackingMap'), {
  ssr: false
});

type ShippingRecord = {
  id: string;
  tracking_number: string;
  status: string;
  current_location: {
    lat: number;
    lng: number;
  };
  estimated_arrival: string;
  history: {
    timestamp: string;
    location: string;
    status: string;
  }[];
};

const ShippingTracking = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<ShippingRecord | null>(null);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipping_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // サンプルデータで補完
      const sampleData: ShippingRecord = {
        id: id as string,
        tracking_number: 'TN123456789',
        status: '配送中',
        current_location: {
          lat: 35.6762,
          lng: 139.6503
        },
        estimated_arrival: '2024-01-20T15:00:00',
        history: [
          {
            timestamp: '2024-01-19T10:00:00',
            location: '東京配送センター',
            status: '発送完了'
          },
          {
            timestamp: '2024-01-19T14:00:00',
            location: '横浜中継所',
            status: '配送中'
          }
        ]
      };

      setTrackingData(data || sampleData);
      setError(null);
    } catch (err) {
      setError('配送情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTrackingData();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="min-h-screen h-full bg-gray-50 flex items-center justify-center">
      <div>読み込み中...</div>
    </div>
  );

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="flex">
        {/* サイドバー */}
        <div className="w-64 bg-white shadow-lg h-screen fixed">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">配送管理</h2>
            <nav>
              <Link href="/shipping/list" className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded">
                <BiPackage className="mr-2" />
                配送一覧
              </Link>
              <Link href="/shipping/tracking" className="flex items-center p-2 text-blue-600 bg-blue-50 rounded">
                <FiTruck className="mr-2" />
                配送状況確認
              </Link>
            </nav>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">配送状況確認</h1>
          </div>

          {error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
              {error}
            </div>
          ) : trackingData && (
            <>
              {/* 配送情報サマリー */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-lg font-bold">追跡番号：{trackingData.tracking_number}</p>
                    <p className="text-gray-600">ステータス: {trackingData.status}</p>
                  </div>
                  <button
                    onClick={fetchTrackingData}
                    className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
                  >
                    <BiRefresh className="mr-2" />
                    更新
                  </button>
                </div>
                <p className="text-gray-600">
                  到着予定: {formatDate(trackingData.estimated_arrival)}
                </p>
              </div>

              {/* 配送マップ */}
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-bold flex items-center">
                    <BiMap className="mr-2" />
                    配送追跡マップ
                  </h2>
                </div>
                <div className="h-96">
                  <MapComponent
                    trackingInfo={trackingData.current_location}
                    deliveryStatus={trackingData.status}
                  />
                </div>
              </div>

              {/* 配送履歴 */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-bold flex items-center">
                    <BiHistory className="mr-2" />
                    配送履歴
                  </h2>
                </div>
                <div className="p-4">
                  {trackingData.history.map((record, index) => (
                    <div key={index} className="flex items-start mb-4">
                      <div className="mr-4 mt-1">
                        <MdLocationOn className="text-blue-500 text-xl" />
                      </div>
                      <div>
                        <p className="font-bold">{record.location}</p>
                        <p className="text-gray-600">{formatDate(record.timestamp)}</p>
                        <p className="text-sm text-gray-500">{record.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingTracking;