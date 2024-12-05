import React, { useState } from 'react';
import { AiOutlineCalendar, AiOutlineFileText } from 'react-icons/ai';
import { IoMdClose } from 'react-icons/io';
import { BiBookOpen } from 'react-icons/bi';
import { supabase } from '@/supabase';

type BookType = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  status: string;
};

interface RequestFormProps {
  book: BookType;
  onSubmit: (data: { bookId: string; purpose: string; duration: string }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

const RequestForm: React.FC<RequestFormProps> = ({
  book,
  onSubmit,
  onCancel,
  isLoading = false,
  error
}) => {
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState('');
  const [errors, setErrors] = useState<{ purpose?: string; duration?: string }>({});

  const validateForm = () => {
    const newErrors: { purpose?: string; duration?: string } = {};
    
    if (!purpose) {
      newErrors.purpose = '利用目的を入力してください';
    } else if (purpose.length > 1000) {
      newErrors.purpose = '1000文字以内で入力してください';
    }

    if (!duration) {
      newErrors.duration = '利用期間を選択してください';
    } else if (parseInt(duration) > 4) {
      newErrors.duration = '利用期間は4週間以内に設定してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        bookId: book.id,
        purpose,
        duration: `${duration}週間`
      });
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">貸出リクエスト</h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
              aria-label="キャンセル"
            >
              <IoMdClose size={24} />
            </button>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <BiBookOpen className="mr-2" />
            書籍情報
          </h3>
          <div className="space-y-2">
            <p className="text-gray-700">書籍名: {book.title}</p>
            <p className="text-gray-700">著者: {book.author}</p>
            <p className="text-gray-700">出版社: {book.publisher}</p>
            <p className="text-gray-700">ISBN: {book.isbn}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="purpose"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              利用目的
            </label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              maxLength={1000}
            />
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              利用期間
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">選択してください</option>
              <option value="1">1週間</option>
              <option value="2">2週間</option>
              <option value="3">3週間</option>
              <option value="4">4週間</option>
            </select>
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
            )}
          </div>

          {error && (
            <div className="error-message text-red-600 text-sm py-2">{error}</div>
          )}

          <div className="flex justify-end space-x-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isLoading ? (
                <span data-testid="loading-spinner" className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </span>
              ) : (
                'リクエスト送信'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;