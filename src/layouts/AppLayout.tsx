// src/layouts/AppLayout.tsx
import { usePlatform } from '@/hooks/usePlatform';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';
import MarshmallowLoader from '@/components/common/MarshmallowLoader';

export default function AppLayout() {
  const { isDesktop, platform } = usePlatform();

  if (!platform) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <MarshmallowLoader />
      </div>
    );
  }

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
