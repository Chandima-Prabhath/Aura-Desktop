// src/components/layout/BottomNavBar.tsx
import { Home, Search, Download, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/downloads', icon: Download, label: 'Downloads' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-md items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground',
                isActive && 'text-foreground',
              )
            }
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
