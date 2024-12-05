import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BiHome, BiBook, BiSearch, BiTransfer, BiTruck, BiMoney, BiCog, BiHelpCircle, BiUserCircle, BiChevronDown, BiMenu } from 'react-icons/bi';

type SidebarProps = {
  userRole: string;
  activeMenu: string;
};

const Sidebar = ({ userRole, activeMenu }: SidebarProps) => {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState(false);

  const menuItems = {
    admin: [
      { id: 'dashboard', label: 'ダッシュボード', icon: <BiHome />, path: '/dashboard' },
      { id: 'books', label: '蔵書管理', icon: <BiBook />, path: '/books' },
      { id: 'lending', label: '貸出管理', icon: <BiTransfer />, path: '/lending' },
      { id: 'shipping', label: '配送管理', icon: <BiTruck />, path: '/shipping' },
      { id: 'billing', label: '決済管理', icon: <BiMoney />, path: '/billing' },
      {
        id: 'settings',
        label: '設定',
        icon: <BiCog />,
        submenu: [
          { id: 'profile', label: 'プロフィール設定', path: '/settings/profile' },
          { id: 'system', label: 'システム設定', path: '/settings/system' },
        ],
      },
    ],
    user: [
      { id: 'dashboard', label: 'ダッシュボード', icon: <BiHome />, path: '/dashboard' },
      { id: 'books', label: '蔵書検索', icon: <BiSearch />, path: '/books' },
      { id: 'lending', label: '貸出履歴', icon: <BiTransfer />, path: '/lending' },
    ],
  };

  const filteredMenuItems = menuItems[userRole as keyof typeof menuItems]?.filter(
    (item) => item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const retryLoading = () => {
    setError(false);
  };

  if (error || !menuItems[userRole as keyof typeof menuItems]) {
    return (
      <div className="p-4 text-center">
        <p>メニューの読み込みに失敗しました</p>
        <button
          onClick={retryLoading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="sidebar-container"
      className={`bg-white min-h-screen h-full border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-20 collapsed' : 'w-64'
      }`}
    >
      <div className="p-4">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded"
          aria-label="メニュー切り替え"
        >
          <BiMenu size={24} />
        </button>

        {!isCollapsed && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="メニュー検索"
              className="w-full px-3 py-2 border rounded"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <nav className="mt-4">
        <ul>
          {filteredMenuItems.map((item) => (
            <li key={item.id}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`w-full flex items-center p-3 hover:bg-gray-100 ${
                      activeMenu === item.id ? 'bg-blue-50 text-blue-600 active' : ''
                    }`}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <>
                        <span className="ml-3">{item.label}</span>
                        <BiChevronDown
                          className={`ml-auto transform ${settingsOpen ? 'rotate-180' : ''}`}
                        />
                      </>
                    )}
                  </button>
                  {settingsOpen && !isCollapsed && (
                    <ul className="ml-8">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.id}>
                          <Link
                            href={subItem.path}
                            className="block p-2 hover:bg-gray-100 rounded"
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.path}
                  className={`flex items-center p-3 hover:bg-gray-100 ${
                    activeMenu === item.id ? 'bg-blue-50 text-blue-600 active' : ''
                  }`}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-4 w-full px-4">
        <div
          data-testid="help-icon"
          className="flex items-center justify-center p-2 hover:bg-gray-100 rounded cursor-help"
          role="tooltip"
        >
          <BiHelpCircle size={24} />
          {!isCollapsed && <span className="ml-2">ヘルプ</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;