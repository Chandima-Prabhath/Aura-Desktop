// src/components/Sidebar/index.tsx
import React from 'react';

type SidebarProps = {
  activeView: string;
  onNavigate: (view: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  return (
    <nav className="sidebar">
      <div className="app-logo">
        <img src="https://z-cdn-media.chatglm.cn/files/ea457398-3990-4b36-b6fa-f4c40c00b9ee.png?auth_key=1868121977-67b2641e583a4d60b47a132d282d0f9a-0-98ec1fcd2692dc170a68493699d3ba3d" alt="Aura Logo" />
      </div>

      <div className="nav-group">
        <div
          className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
          data-tooltip="Home"
        >
          <svg className="icon" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
        </div>

        <div
          className={`nav-item ${activeView === 'downloads' ? 'active' : ''}`}
          onClick={() => onNavigate('downloads')}
          data-tooltip="Downloads"
        >
          <svg className="icon" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
        </div>
      </div>

      <div className="spacer"></div>

      <div className="nav-group">
        <div
          className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
          data-tooltip="Settings"
        >
          <svg className="icon" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
