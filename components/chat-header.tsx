'use client';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { memo } from 'react';
import { Zap, Lightbulb, Brain } from 'lucide-react';

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
    icon: <Zap className="size-5" />,
    colorIcon: 'text-yellow-400',
  },
  medium: {
    label: 'Normal',
    icon: <Lightbulb className="size-5" />,
    colorIcon: 'text-blue-500',
  },
  high: {
    label: 'Avanzado',
    icon: <Brain className="size-5" />,
    colorIcon: 'text-purple-600',
  },
};

function StaticPowerDisplay({ selectedPower }: { selectedPower: PowerLevel }) {
  const details = powerLevelDetails[selectedPower] || powerLevelDetails.medium;

  return (
    <div className="flex items-center justify-center h-9 min-w-32 px-3 gap-2.5 font-medium">
      <span className={`flex items-center ${details.colorIcon}`}>
        {details.icon}
      </span>
      <span className="text-base whitespace-nowrap flex items-center">
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
                variant="outline"
                className="md:px-2 px-2 md:h-fit"
                onClick={() => {
                  router.push('/');
                  router.refresh();
                }}
              >
                <PlusIcon />
                <span className="md:sr-only">New Chat</span>
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
            <StaticPowerDisplay selectedPower={selectedPower} />
          ))}

        {!isReadonly && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        )}
      </div>

      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.selectedPower === nextProps.selectedPower
  );
});
