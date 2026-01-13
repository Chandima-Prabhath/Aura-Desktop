// src/layouts/DesktopLayout.tsx
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/TopBar';
import { Outlet } from 'react-router-dom';

export default function DesktopLayout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar />
        <div className="container mx-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
