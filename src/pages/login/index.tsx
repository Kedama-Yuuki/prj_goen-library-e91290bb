import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FaEye, FaEyeSlash, FaBuilding, FaLock } from 'react-icons/fa';
import { supabase } from '@/supabase';

export default function Login() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ companyId?: string; password?: string; auth?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { companyId?: string; password?: string } = {};
    if (!companyId) newErrors.companyId = '企業IDを入力してください';
    if (!password) newErrors.password = 'パスワードを入力してください';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: companyId,
        password: password,
      });

      if (error) {
        setErrors({ auth: '認証に失敗しました' });
        return;
      }

      if (data.user) {
        router.push('/dashboard');
      }
    } catch (error) {
      setErrors({ auth: '認証に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-full flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Image
            src="https://placehold.co/200x80"
            alt="Company Logo"
            width={200}
            height={80}
            className="mx-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ビジネスライブラリーコネクト
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            企業間の知識共有プラットフォーム
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="company-id" className="sr-only">
                企業ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <FaBuilding className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="company-id"
                  name="company-id"
                  type="text"
                  aria-label="企業ID"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="企業ID"
                />
              </div>
              {errors.companyId && (
                <p className="text-red-500 text-xs mt-1">{errors.companyId}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  aria-label="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="パスワード"
                />
                <button
                  type="button"
                  aria-label="パスワードを表示"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
          </div>

          {errors.auth && (
            <div className="text-red-500 text-sm text-center">{errors.auth}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <span>ログイン中...</span>
              ) : (
                <span>ログイン</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}