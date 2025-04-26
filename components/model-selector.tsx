'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { chatModelConfigurations } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

interface ModelSelectorProps {
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
}

export function ModelSelector({
  selectedModelId,
  setSelectedModelId,
}: ModelSelectorProps) {
  const selectedModel = chatModelConfigurations.find(
    (model) => model.id === selectedModelId,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
          {selectedModel ? (
            <>
              <span className="text-sm font-medium">{selectedModel.name}</span>
              <ChevronDownIcon />
            </>
          ) : (
            <span className="text-sm font-medium">Select Model</span> // Fallback
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Available Models</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {chatModelConfigurations.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onSelect={() => setSelectedModelId(model.id)}
              className={cn(
                'cursor-pointer flex items-center justify-between',
                model.id === selectedModelId && 'bg-accent',
              )}
            >
              <div>
                <div className="font-medium flex items-center gap-2">
                  {model.name}
                  {model.supportsReasoning && (
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                      Reasoning
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {model.description}
                </div>
              </div>
              {model.id === selectedModelId && <CheckCircleFillIcon />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
