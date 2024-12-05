import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FiBell, FiMenu, FiSearch, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { supabase } from '@/supabase';

type UserType = {
  id: string;
  name: string;
  email: string;
  role: string;
} | null;

type HeaderProps = {
  user: UserType;
  isLoggedIn: boolean;
};

const Header = ({ user, isLoggedIn }: HeaderProps) => {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('#user-menu') && !target.closest('#user-menu-button')) {
      setIsUserMenuOpen(false);
    }
    if (!target.closest('#notification-panel') && !target.closest('#notification-button')) {
      setIsNotificationOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="https://placehold.co/200x50"
                alt="ビジネスライブラリーコネクトロゴ"
                width={200}
                height={50}
                className="cursor-pointer"
              />
            </Link>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/books" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                蔵書管理
              </Link>
              <Link href="/search" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                検索
              </Link>
              <Link href="/lending" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                貸出管理
              </Link>
            </nav>
          </div>

          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="書籍を検索..."
                  className="w-full sm:w-64 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FiSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            {isLoggedIn && (
              <>
                <button
                  id="notification-button"
                  aria-label="通知"
                  className="ml-4 p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                >
                  <FiBell className="h-6 w-6" />
                </button>

                {isNotificationOpen && (
                  <div id="notification-panel" data-testid="notification-panel" className="absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                    {/* 通知パネルの内容 */}
                  </div>
                )}

                <div className="ml-3 relative">
                  <button
                    id="user-menu-button"
                    aria-label="ユーザーメニュー"
                    className="flex items-center"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                    <FiUser className="ml-2 h-6 w-6" />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      id="user-menu"
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5"
                    >
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        プロフィール
                      </Link>
                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!isLoggedIn && (
              <Link href="/login" className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                ログイン
              </Link>
            )}

            <button
              aria-label="メニュー"
              className="ml-4 md:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <FiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* モバイルメニュー */}
      <div
        data-testid="mobile-menu"
        className={`md:hidden ${isMobileMenuOpen ? 'active' : 'hidden'}`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/books" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            蔵書管理
          </Link>
          <Link href="/search" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            検索
          </Link>
          <Link href="/lending" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            貸出管理
          </Link>
        </div>
      </div>

      {/* ログアウト確認モーダル */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">ログアウトしますか？</h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
              >
                キャンセル
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;