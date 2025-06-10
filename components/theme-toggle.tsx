'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cambiar modo oscuro/claro"
        className={className}
        disabled
      >
        <div className="size-5" />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar modo oscuro/claro"
      onClick={toggleTheme}
      className={className}
    >
      {resolvedTheme === 'dark' ? (
        <SunIcon className="size-5 transition-transform duration-300 rotate-0" />
      ) : (
        <MoonIcon className="size-5 transition-transform duration-300 rotate-0" />
      )}
    </Button>
  );
}
