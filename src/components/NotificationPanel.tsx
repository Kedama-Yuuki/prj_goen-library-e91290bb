import { useState, useEffect } from 'react';
import { IoNotifications, IoCheckmarkCircle } from 'react-icons/io5';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type NotificationType = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationPanelProps = {
  notifications: NotificationType[];
  onRead: (id: string) => void;
};

const NotificationPanel = ({ notifications, onRead }: NotificationPanelProps) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const handleNotificationClick = (id: string) => {
    onRead(id);
  };

  const handleMarkAllRead = () => {
    notifications
      .filter(n => !n.isRead)
      .forEach(n => onRead(n.id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy年M月d日 HH:mm', { locale: ja });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IoNotifications className="text-2xl text-blue-600" />
          <h2 className="text-lg font-semibold">通知</h2>
          <span className="text-sm text-gray-600">未読: {unreadCount}件</span>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            全て既読にする
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-8">通知はありません</div>
      ) : (
        <ul role="list" className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className={`cursor-pointer p-3 rounded-md transition-colors ${
                notification.isRead ? 'bg-white' : 'bg-blue-50'
              } hover:bg-gray-50`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                {notification.isRead && (
                  <IoCheckmarkCircle className="text-green-500 text-xl flex-shrink-0" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationPanel;