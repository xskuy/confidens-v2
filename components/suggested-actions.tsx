'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo, useState, useEffect } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { RefreshCw, User, Mail, FileText, Cpu } from 'lucide-react';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  const allSuggestedActions = [
    {
      title: 'Write a to-do list for a',
      label: 'personal project or task',
      action: 'Write a to-do list for a personal project or task',
      icon: <User className="size-5 text-muted-foreground" />,
    },
    {
      title: 'Generate an email to reply',
      label: 'to a job offer',
      action: 'Generate an email to reply to a job offer',
      icon: <Mail className="size-5 text-muted-foreground" />,
    },
    {
      title: 'Summarise this article or',
      label: 'text for me in one paragraph',
      action: 'Summarise this article or text for me in one paragraph',
      icon: <FileText className="size-5 text-muted-foreground" />,
    },
    {
      title: 'How does AI work in a',
      label: 'technical capacity',
      action: 'How does AI work in a technical capacity',
      icon: <Cpu className="size-5 text-muted-foreground" />,
    },
    {
      title: 'What are the advantages',
      label: 'of using Next.js?',
      action: 'What are the advantages of using Next.js?',
      icon: <FileText className="size-5 text-muted-foreground" />,
    },
    {
      title: 'Write code to',
      label: `demonstrate djikstra's algorithm`,
      action: `Write code to demonstrate djikstra's algorithm`,
      icon: <Cpu className="size-5 text-muted-foreground" />,
    },
    {
      title: 'Help me write an essay',
      label: `about silicon valley`,
      action: `Help me write an essay about silicon valley`,
      icon: <FileText className="size-5 text-muted-foreground" />,
    },
    {
      title: 'What is the weather',
      label: 'in San Francisco?',
      action: 'What is the weather in San Francisco?',
      icon: <User className="size-5 text-muted-foreground" />,
    },
  ];

  // Usar las primeras 4 acciones como default para evitar hidration mismatch
  const getInitialActions = () => {
    return allSuggestedActions.slice(0, 4);
  };

  // Seleccionar 4 acciones aleatorias solo después de la hidratación
  const getRandomActions = () => {
    if (!isHydrated) {
      return getInitialActions();
    }
    const shuffled = [...allSuggestedActions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  const [suggestedActions, setSuggestedActions] = useState(getInitialActions);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleRefresh = () => {
    if (isHydrated) {
      const newActions = [...allSuggestedActions]
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);
      setSuggestedActions(newActions);
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Grid de acciones sugeridas */}
      <div
        data-testid="suggested-actions"
        className="grid grid-cols-4 gap-3 w-full"
        key={refreshKey}
      >
        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 * index }}
            key={`suggested-action-${suggestedAction.title}-${index}-${refreshKey}`}
          >
            <Button
              variant="ghost"
              onClick={async () => {
                window.history.replaceState({}, '', `/chat/${chatId}`);

                append({
                  role: 'user',
                  content: suggestedAction.action,
                });
              }}
              className="text-left border rounded-xl p-3 text-sm flex flex-col w-full h-28 justify-between items-start hover:bg-muted/50 transition-all duration-500 ease-in-out hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/10 group"
            >
              <div className="flex flex-col gap-1 text-left">
                <span className="font-medium text-foreground text-xs leading-tight group-hover:text-yellow-600 transition-colors duration-300">
                  {suggestedAction.title}
                </span>
                <span className="text-muted-foreground text-xs leading-tight group-hover:text-yellow-500/80 transition-colors duration-300">
                  {suggestedAction.label}
                </span>
              </div>
              <div className="self-start group-hover:text-yellow-500 transition-colors duration-300">
                {suggestedAction.icon}
              </div>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Botón Refresh Prompts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-start"
      >
        <Button
          variant="ghost"
          onClick={handleRefresh}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <RefreshCw className="size-4" />
          Refresh Prompts
        </Button>
      </motion.div>
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
