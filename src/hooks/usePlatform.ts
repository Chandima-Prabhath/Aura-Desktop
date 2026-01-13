import { useState, useEffect } from 'react';
import { platform as getPlatform } from '@tauri-apps/plugin-os';

export type Platform = 'linux' | 'macos' | 'ios' | 'freebsd' | 'dragonfly' | 'netbsd' | 'openbsd' | 'solaris' | 'android' | 'windows';

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPlatform = async () => {
      try {
        const platformName = await getPlatform();
        if (isMounted) {
          setPlatform(platformName);
        }
      } catch (error) {
        console.error("Failed to fetch platform:", error);
        // Fallback for non-Tauri environments (e.g., web browser)
        if (isMounted) {
            // simple fallback
            const userAgent = window.navigator.userAgent.toLowerCase();
            if (userAgent.includes("android")) {
                setPlatform('android');
            } else if (userAgent.includes("windows")) {
                setPlatform('windows');
            } else {
                setPlatform('linux');
            }
        }
      }
    };

    fetchPlatform();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    platform,
    isMobile: platform === 'android' || platform === 'ios',
    isDesktop: platform === 'windows' || platform === 'macos' || platform === 'linux',
  };
}
