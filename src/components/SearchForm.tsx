import { useState, useEffect } from 'react';
import { IoSearchOutline, IoRefreshOutline } from 'react-icons/io5';

type SearchParamsType = {
  keyword: string;
  category: string;
  author: string;
  publisher: string;
};

type SearchFormProps = {
  onSearch: (params: SearchParamsType) => void;
  defaultValues?: SearchParamsType;
};

const SearchForm = ({ onSearch, defaultValues }: SearchFormProps) => {
  const [searchParams, setSearchParams] = useState<SearchParamsType>({
    keyword: defaultValues?.keyword || '',
    category: defaultValues?.category || '',
    author: defaultValues?.author || '',
    publisher: defaultValues?.publisher || '',
  });

  const [errors, setErrors] = useState<Partial<SearchParamsType>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const validateForm = () => {
    const newErrors: Partial<SearchParamsType> = {};
    if (!searchParams.keyword.trim()) {
      newErrors.keyword = 'キーワードは必須です';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSearch(searchParams);
      
      const newHistory = [searchParams.keyword, ...searchHistory.filter(h => h !== searchParams.keyword)].slice(0, 5);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSearchParams({
      keyword: '',
      category: '',
      author: '',
      publisher: '',
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="space-y-4">
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">
            キーワード
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              id="keyword"
              name="keyword"
              value={searchParams.keyword}
              onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
              className={`block w-full rounded-md border ${
                errors.keyword ? 'border-red-300' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
              list="search-history"
            />
            <datalist id="search-history">
              {searchHistory.map((item, index) => (
                <option key={index} value={item} role="option">
                  {item}
                </option>
              ))}
            </datalist>
            {errors.keyword && (
              <p className="mt-1 text-sm text-red-600">{errors.keyword}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            検索カテゴリ
          </label>
          <select
            id="category"
            name="category"
            value={searchParams.category}
            onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            <option value="書籍">書籍</option>
            <option value="技術書">技術書</option>
            <option value="雑誌">雑誌</option>
          </select>
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700">
            著者
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={searchParams.author}
            onChange={(e) => setSearchParams({ ...searchParams, author: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="publisher" className="block text-sm font-medium text-gray-700">
            出版社
          </label>
          <input
            type="text"
            id="publisher"
            name="publisher"
            value={searchParams.publisher}
            onChange={(e) => setSearchParams({ ...searchParams, publisher: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <IoRefreshOutline className="mr-2 h-5 w-5" />
            リセット
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <IoSearchOutline className="mr-2 h-5 w-5" />
            {isSubmitting ? '検索中...' : '検索'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchForm;