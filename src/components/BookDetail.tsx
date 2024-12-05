import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBook, FaHistory, FaEdit, FaArrowLeft, FaBarcode } from 'react-icons/fa';
import { TbBookUpload } from 'react-icons/tb';
import { toast } from 'react-hot-toast';
import Topbar from '@/components/Topbar';
import { supabase } from '@/supabase';

type BookType = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  status: string;
  lendingConditions: {
    lendingPeriod: number;
    restrictedCompanies?: string[];
  };
};

type LendingType = {
  id: string;
  borrowerId: string;
  borrowerName: string;
  lendingDate: string;
  returnDueDate: string;
  actualReturnDate?: string;
  status: string;
};

type BookDetailProps = {
  book: BookType;
  lendingHistory: LendingType[];
};

const BookDetail = ({ book, lendingHistory }: BookDetailProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    router.push(`/books/${book.id}/edit`);
  };

  const handleBack = () => {
    router.back();
  };

  const fetchISBNInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.example.com/books/${book.isbn}`);
      if (response.ok) {
        toast.success('ISBN情報を更新しました');
      } else {
        throw new Error();
      }
    } catch {
      toast.error('ISBN情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <FaBook className="mr-2" /> 書籍詳細
            </h1>
            <div className="space-x-4">
              <button
                onClick={handleBack}
                className="px-4 py-2 flex items-center text-gray-600 hover:text-gray-800"
              >
                <FaArrowLeft className="mr-2" /> 戻る
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
              >
                <FaEdit className="mr-2" /> 編集
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{book.title}</h2>
              <div className="space-y-2">
                <p><span className="font-medium">著者:</span> {book.author}</p>
                <p><span className="font-medium">出版社:</span> {book.publisher}</p>
                <p><span className="font-medium">ISBN:</span> {book.isbn}</p>
                <p><span className="font-medium">状態:</span> {book.status}</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchISBNInfo}
                    disabled={isLoading}
                    className="px-3 py-1 bg-gray-100 rounded-md flex items-center hover:bg-gray-200"
                  >
                    <FaBarcode className="mr-2" /> ISBN情報取得
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">貸出条件</h3>
                <p><span className="font-medium">貸出期間:</span> {book.lendingConditions.lendingPeriod}日間</p>
                {book.lendingConditions.restrictedCompanies && (
                  <div>
                    <p className="font-medium">制限付き企業:</p>
                    <ul className="list-disc list-inside pl-4">
                      {book.lendingConditions.restrictedCompanies.map((company, index) => (
                        <li key={index}>{company}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaHistory className="mr-2" /> 貸出履歴
              </h3>
              {lendingHistory.length > 0 ? (
                <div className="space-y-4">
                  {lendingHistory.map((record) => (
                    <div key={record.id} className="border-b pb-4">
                      <p><span className="font-medium">貸出者:</span> {record.borrowerName}</p>
                      <p><span className="font-medium">貸出日:</span> {record.lendingDate}</p>
                      <p><span className="font-medium">返却期限:</span> {record.returnDueDate}</p>
                      {record.actualReturnDate && (
                        <p><span className="font-medium">返却日:</span> {record.actualReturnDate}</p>
                      )}
                      <p><span className="font-medium">状態:</span> {record.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">貸出履歴はありません</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;