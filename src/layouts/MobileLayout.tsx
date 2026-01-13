// src/layouts/MobileLayout.tsx
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import TopBar from '@/components/TopBar';
import { Outlet } from 'react-router-dom';

export default function MobileLayout() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto p-4">
          <Outlet />
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}
