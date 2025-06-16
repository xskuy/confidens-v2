'use client';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import React, { memo } from 'react';
import { Lightbulb, Orbit, Rocket } from 'lucide-react';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import { ThemeToggle } from './theme-toggle';
import { useDevMode } from '@/context/dev-mode';
import type { PowerLevel } from '@/lib/ai/ai-models.config';

const powerLevelDetails: Record<
  PowerLevel,
  {
    label: string;
    icon: React.ReactNode;
    colorIcon: string;
  }
> = {
  low: {
    label: 'Rápido',
    icon: <Rocket className="size-6" />,
    colorIcon: 'text-black dark:text-white',
  },
  medium: {
    label: 'Normal',
    icon: <Lightbulb className="size-5" />,
    colorIcon: 'text-blue-500',
  },
  high: {
    label: 'Avanzado',
    icon: <Orbit className="size-6" />,
    colorIcon: 'text-yellow-500',
  },
};

function StaticPowerDisplay({ selectedPower }: { selectedPower: PowerLevel }) {
  const details = powerLevelDetails[selectedPower] || powerLevelDetails.medium;

  return (
    <div className="relative z-10 flex items-center justify-center gap-1 font-medium text-muted-foreground group-hover:text-foreground w-20">
      <span className={`flex items-center ${details.colorIcon}`}>
        {React.cloneElement(details.icon as React.ReactElement, {
          className: 'size-4',
        })}
      </span>
      <span className="text-xs whitespace-nowrap flex items-center">
        {details.label}
      </span>
    </div>
  );
}

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  setSelectedModelId,
  selectedPower,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  setSelectedModelId: (modelId: string) => void;
  selectedPower: PowerLevel;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const { isDevMode } = useDevMode();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 justify-between">
      <div className="flex items-center gap-2">
        <SidebarToggle />

        {(!open || windowWidth < 768) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="group relative md:px-2 px-2 md:h-fit backdrop-blur-xl bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] text-muted-foreground hover:text-foreground transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] rounded-2xl"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push('/');
                  router.refresh();
                }}
              >
                <PlusIcon />
                <span className="md:sr-only">New Chat</span>

                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        )}

        {!isReadonly &&
          (isDevMode ? (
            <ModelSelector
              selectedModelId={selectedModelId}
              setSelectedModelId={setSelectedModelId}
            />
          ) : (
            <div className="group relative backdrop-blur-xl bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] text-muted-foreground hover:text-foreground transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] rounded-2xl md:px-2 md:h-fit py-2">
              <StaticPowerDisplay selectedPower={selectedPower} />

              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

              {/* Borde interno de brillo */}
              <div className="absolute inset-0 rounded-2xl border border-white/[0.10] opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </div>
          ))}

        {!isReadonly && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        )}
      </div>

      <div className="flex items-center">
        <ThemeToggle className="backdrop-blur-xl bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] text-muted-foreground hover:text-foreground transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]" />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.chatId === nextProps.chatId &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.selectedPower === nextProps.selectedPower
  );
});
