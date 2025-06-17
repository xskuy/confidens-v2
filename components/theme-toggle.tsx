'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
        className={cn('group relative', className)}
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
      className={cn('group relative rounded-2xl', className)}
    >
      <span className="relative z-10">
        {resolvedTheme === 'dark' ? (
          <SunIcon className="size-5 transition-transform duration-300 rotate-0" />
        ) : (
          <MoonIcon className="size-5 transition-transform duration-300 rotate-0" />
        )}
      </span>

      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

      {/* Borde interno de brillo */}
      <div className="absolute inset-0 rounded-2xl border border-white/[0.10] opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
    </Button>
  );
}
