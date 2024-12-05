import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaBarcode, FaBook, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '@/supabase';
import Quagga from 'quagga';

export default function RegisterPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    lending_conditions: {
      lending_period: 14,
      can_extend: true,
    },
    status: 'available'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.isbn) newErrors.isbn = 'ISBNは必須です';
    if (formData.isbn && !/^\d{13}$/.test(formData.isbn)) newErrors.isbn = 'ISBNは13桁の数字で入力してください';
    if (!formData.title) newErrors.title = 'タイトルは必須です';
    if (!formData.author) newErrors.author = '著者は必須です';
    if (!formData.publisher) newErrors.publisher = '出版社は必須です';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('books').insert([
        {
          company_id: user.id,
          ...formData
        }
      ]);

      if (error) throw error;

      setSubmitMessage('登録が完了しました');
      setTimeout(() => {
        router.push('/books');
      }, 2000);
    } catch (error) {
      setSubmitMessage('登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
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
        readers: ["ean_reader", "ean_8_reader"]
      }
    }, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected((result) => {
      if (result.codeResult.code) {
        setFormData(prev => ({ ...prev, isbn: result.codeResult.code }));
        stopScanning();
      }
    });
  };

  const stopScanning = () => {
    Quagga.stop();
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (isScanning) {
        Quagga.stop();
      }
    };
  }, [isScanning]);

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">蔵書登録</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} role="form">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">ISBN</label>
                <div className="mt-1 flex">
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    data-testid="isbn-input"
                  />
                  <button
                    type="button"
                    onClick={startScanning}
                    className="ml-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaBarcode className="mr-2" />
                    ISBNスキャン
                  </button>
                </div>
                {errors.isbn && <p className="mt-1 text-sm text-red-600">{errors.isbn}</p>}
              </div>

              {isScanning && (
                <div className="mt-4">
                  <div id="camera-view" data-testid="camera-view" className="w-full h-64 bg-gray-100 rounded-lg" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">タイトル</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">著者</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">出版社</label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.publisher && <p className="mt-1 text-sm text-red-600">{errors.publisher}</p>}
              </div>

              <div className="flex justify-between items-center mt-8">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {showPreview ? 'プレビューを隠す' : 'プレビューを表示'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <FaBook className="mr-2" />
                  登録
                </button>
              </div>
            </div>
          </form>

          {showPreview && (
            <div className="mt-8 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium mb-4">プレビュー</h3>
              <div className="space-y-2">
                <p data-testid="preview-isbn">ISBN: {formData.isbn}</p>
                <p data-testid="preview-title">タイトル: {formData.title}</p>
                <p data-testid="preview-author">著者: {formData.author}</p>
                <p data-testid="preview-publisher">出版社: {formData.publisher}</p>
              </div>
            </div>
          )}

          {submitMessage && (
            <div className={`mt-4 p-4 rounded-md ${submitMessage.includes('完了') ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {submitMessage.includes('完了') ? (
                    <FaCheck className="text-green-400" />
                  ) : (
                    <FaExclamationCircle className="text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${submitMessage.includes('完了') ? 'text-green-800' : 'text-red-800'}`}>
                    {submitMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}