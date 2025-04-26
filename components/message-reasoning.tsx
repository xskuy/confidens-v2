'use client';

import { useState } from 'react';
import { ChevronDownIcon, LoaderIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Ícono de bombilla para el razonamiento
function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-4', className)}
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '0.5rem',
      marginBottom: '0.5rem',
    },
  };

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-row gap-2 items-center text-amber-600 dark:text-amber-400">
          <LightbulbIcon />
          <div className="font-medium text-sm">Pensando...</div>
          <div className="animate-spin">
            <LoaderIcon size={12} />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center text-amber-600 dark:text-amber-400">
          <LightbulbIcon />
          <div className="font-medium text-sm">Razonamiento</div>
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className={cn(
              'cursor-pointer transition-transform duration-200',
              isExpanded ? 'rotate-180' : 'rotate-0',
            )}
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDownIcon size={14} />
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-4 text-zinc-600 dark:text-zinc-400 border-l border-amber-200 dark:border-amber-800 flex flex-col gap-2"
          >
            <pre className="text-xs font-mono bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
              {reasoning}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
