import React, { useState, useEffect, useRef } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  level: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  actionLabel?: string;
}

type TopBarProps = {
  pageTitle: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onNotificationAction?: (notificationId: string) => void;
};

const TopBar: React.FC<TopBarProps> = ({
  pageTitle,
  canGoBack,
  onGoBack,
  notifications,
  onMarkAllRead,
  onNotificationAction,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifOpen(!notifOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {canGoBack && onGoBack && (
          <button
            className="back-button"
            onClick={onGoBack}
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="page-title" id="page-title">{pageTitle}</div>
      </div>

      <div className="notif-container" onClick={toggleNotifications} ref={notifRef}>
        <svg className="icon" viewBox="0 0 24 24" style={{ color: 'var(--secondary)' }}><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" /></svg>
        {unreadCount > 0 && <div className="notif-badge" id="notif-dot"></div>}

        <div className={`notif-dropdown ${notifOpen ? 'show' : ''}`} id="notif-dropdown">
          <div className="notif-dropdown-header">
            <strong>Notifications</strong>
            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onMarkAllRead(); }}>
              Mark all read
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="notif-item">
              <div>
                <span style={{ color: 'var(--text-muted)' }}>No notifications</span>
              </div>
            </div>
          ) : (
            notifications.slice(0, 20).map((notification) => (
              <div key={notification.id} className="notif-item">
                <div className="notif-dot"></div>
                <div>
                  <strong>{notification.title}</strong><br />
                  <span style={{ color: 'var(--text-muted)' }}>{notification.message}</span>
                  {notification.actionLabel && onNotificationAction && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        className="dl-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNotificationAction(notification.id);
                        }}
                      >
                        {notification.actionLabel}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div className="notif-item" style={{ justifyContent: 'flex-end' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
