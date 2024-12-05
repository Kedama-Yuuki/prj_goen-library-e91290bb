import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaBarcode, FaCamera, FaTimes, FaHome, FaBook, FaBox, FaClipboardCheck, FaExclamationTriangle } from 'react-icons/fa';
import Quagga from 'quagga';
import axios from 'axios';

const BookScanPage = () => {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [cameraAccess, setCameraAccess] = useState(false);

  const initializeScanner = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraAccess(true);
      stream.getTracks().forEach(track => track.stop());

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#camera-view"),
          constraints: {
            facingMode: "environment"
          },
        },
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "isbn_reader"]
        }
      }, (err) => {
        if (err) {
          setError('カメラの初期化に失敗しました');
          return;
        }
        setScanning(true);
        Quagga.start();
      });

      Quagga.onDetected(async (result) => {
        if (result.codeResult.code) {
          try {
            const response = await axios.post('/api/books/scan-isbn', {
              isbn: result.codeResult.code
            });
            setScanResult(response.data);
            Quagga.stop();
            setScanning(false);
          } catch (err) {
            setError('書籍情報の取得に失敗しました');
          }
        }
      });
    } catch (err) {
      setError('カメラへのアクセスを許可してください');
    }
  }, []);

  useEffect(() => {
    initializeScanner();
    return () => {
      if (Quagga) {
        Quagga.stop();
      }
    };
  }, [initializeScanner]);

  const handleRescan = () => {
    setScanResult(null);
    setError('');
    initializeScanner();
  };

  const handleConfirm = () => {
    if (scanResult?.isbn) {
      router.push(`/books/register?isbn=${scanResult.isbn}`);
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-50 flex">
      <nav className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">メニュー</h2>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/" className="flex items-center p-2 text-gray-600 hover:bg-blue-50 rounded">
                <FaHome className="mr-2" />
                ホーム
              </Link>
            </li>
            <li>
              <Link href="/books" className="flex items-center p-2 text-gray-600 hover:bg-blue-50 rounded">
                <FaBook className="mr-2" />
                蔵書一覧
              </Link>
            </li>
            <li>
              <Link href="/books/scan" className="flex items-center p-2 bg-blue-100 text-blue-600 rounded">
                <FaBarcode className="mr-2" />
                バーコードスキャン
              </Link>
            </li>
            <li>
              <Link href="/books/check" className="flex items-center p-2 text-gray-600 hover:bg-blue-50 rounded">
                <FaClipboardCheck className="mr-2" />
                蔵書点検
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">バーコードスキャン</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <FaExclamationTriangle className="mr-2" />
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6">
            {!scanResult && (
              <div className="relative">
                <div id="camera-view" data-testid="camera-view" className="w-full h-64 bg-gray-900 rounded"></div>
                {!cameraAccess && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <FaCamera className="text-4xl" />
                  </div>
                )}
              </div>
            )}

            {scanResult && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">スキャン結果</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">タイトル:</span> {scanResult.title}</p>
                  <p><span className="font-medium">著者:</span> {scanResult.author}</p>
                  <p><span className="font-medium">出版社:</span> {scanResult.publisher}</p>
                  <p><span className="font-medium">ISBN:</span> {scanResult.isbn}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                キャンセル
              </button>
              {scanResult ? (
                <>
                  <button
                    onClick={handleRescan}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    再スキャン
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    確認
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setScanning(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  スキャン開始
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <div data-testid="barcode-scanner" style={{ display: 'none' }} />
    </div>
  );
};

export default BookScanPage;