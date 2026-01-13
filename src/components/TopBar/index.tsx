// src/components/TopBar/index.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useIsFetching } from '@tanstack/react-query';
import { checkHealth } from '../../lib/api/health';
import { usePlatform } from '@/hooks/usePlatform';
import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TopBar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = usePlatform();

  const { data: health, isSuccess, isError } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 5000,
  });

  const isFetching = useIsFetching() > 0;

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Home';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

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

  const handleSearchFocus = () => {
    if (location.pathname !== '/search') {
      navigate('/search');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <h1 className="text-xl font-semibold">{getPageTitle()}</h1>

      {isMobile && (
        <div className="relative flex-1 px-4">
          <input
            type="text"
            className="w-full rounded-full border bg-muted py-2 pl-10 pr-4"
            placeholder="Search..."
            onFocus={handleSearchFocus}
          />
          <Search className="absolute left-7 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-3 w-3 rounded-full',
              isError && 'bg-red-500',
              isSuccess && health?.status === '200' && 'bg-green-500',
              isFetching && 'animate-pulse bg-green-300',
            )}
            aria-label={`API Status: ${isError ? 'Unhealthy' : 'Healthy'}`}
          />
          <span className="hidden text-sm md:inline">API Status</span>
        </div>

        <div className="relative" ref={notifRef}>
          <button onClick={toggleNotifications} className="relative rounded-full p-2 hover:bg-accent">
            <Bell className="h-6 w-6" />
            <span className="absolute right-2 top-2 block h-2 w-2 rounded-full bg-primary" id="notif-dot" />
          </button>

          <div className={cn("absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 transition-transform", !notifOpen && 'scale-0' )}>
            <div className="p-4">
              <p className="font-semibold">Notifications</p>
              {/* Example Notifications */}
              <div className="mt-2 text-sm">Update Available: v0.0.3</div>
              <div className="mt-1 text-sm text-muted-foreground">Download Complete: Slime Ep 12</div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
