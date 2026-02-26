// src/components/BottomNavBar/index.tsx
import React from 'react';

interface BottomNavBarProps {
    activeView: string;
    onNavigate: (view: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onNavigate }) => {
    const navItems = [
        {
            id: 'home',
            label: 'Home',
            icon: <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
        },
        {
            id: 'search',
            label: 'Search',
            icon: <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
        },
        {
            id: 'downloads',
            label: 'Downloads',
            icon: <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: <svg className="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.44,0.17-0.48,0.41L9.18,5.18C8.59,5.42,8.06,5.74,7.56,6.12L5.17,5.16C4.95,5.09,4.7,5.16,4.59,5.36l-1.92,3.32 C2.56,8.88,2.61,9.15,2.79,9.29l2.03,1.58C4.8,11.16,4.78,11.48,4.78,11.8c0,0.32,0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.42,2.37 c0.04,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.48-0.41l0.42-2.37c0.59-0.24,1.12-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0.01,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" /></svg>
        }
    ];

    return (
        <nav className="bottom-nav-bar">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`bottom-nav-item ${activeView === item.id ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    aria-label={item.label}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default BottomNavBar;
