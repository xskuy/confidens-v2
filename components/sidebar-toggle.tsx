import type { ComponentProps } from 'react';

import { type SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { SidebarLeftIcon } from './icons';
import { Button } from './ui/button';

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
          }}
          variant="outline"
          className="group relative md:px-2 md:h-fit backdrop-blur-xl bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] text-muted-foreground hover:text-foreground transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] rounded-2xl"
        >
          <span className="relative z-10">
            <SidebarLeftIcon size={16} />
          </span>

          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

          {/* Borde interno de brillo */}
          <div className="absolute inset-0 rounded-2xl border border-white/[0.10] opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle Sidebar</TooltipContent>
    </Tooltip>
  );
}
