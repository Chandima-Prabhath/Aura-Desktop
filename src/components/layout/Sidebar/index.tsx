// src/components/layout/Sidebar/index.tsx
import { NavLink } from 'react-router-dom';
import { Home, Download, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/downloads', icon: Download, label: 'Downloads' },
];

const settingsItem = { href: '/settings', icon: Settings, label: 'Settings' };

export default function Sidebar() {
  return (
    <nav className="hidden h-screen w-20 flex-col items-center gap-4 border-r bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:flex">
      <div className="mb-4">
        {/* You can place your app logo here */}
        <img src="/icon.png" alt="Aura Logo" className="h-10 w-10" />
      </div>

      <div className="flex flex-col items-center gap-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end // Use 'end' for the root path to avoid it matching all routes
            className={({ isActive }) =>
              cn(
                'flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                isActive && 'bg-primary text-primary-foreground',
              )
            }
            aria-label={item.label}
          >
            <item.icon className="h-6 w-6" />
          </NavLink>
        ))}
      </div>

      <div className="mt-auto">
        <NavLink
          to={settingsItem.href}
          className={({ isActive }) =>
            cn(
              'flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              isActive && 'bg-primary text-primary-foreground',
            )
          }
          aria-label={settingsItem.label}
        >
          <settingsItem.icon className="h-6 w-6" />
        </NavLink>
      </div>
    </nav>
  );
}
