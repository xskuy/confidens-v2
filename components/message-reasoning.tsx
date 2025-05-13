'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
  reasoningTime?: number; // Time in seconds
  defaultExpanded?: boolean;
}

export function MessageReasoning({
  isLoading,
  reasoning,
  reasoningTime = 0,
  defaultExpanded = true,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Parse reasoning into paragraphs
  const paragraphs = reasoning
    .split('\n\n')
    .filter((paragraph) => paragraph.trim() !== '')
    .map((paragraph) => paragraph.trim());

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
    },
  };

  return (
    <div className="mt-6 mb-4">
      <button
        data-testid="message-reasoning-toggle"
        type="button"
        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="reasoning-content"
      >
        <span className="text-lg font-medium">
          Thought for {reasoningTime} seconds
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 transition-transform duration-200',
            isExpanded ? 'rotate-180' : 'rotate-0',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="reasoning-content"
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden' }}
            className="mt-3 text-gray-300"
          >
            {isLoading ? (
              <div className="flex flex-col gap-3 animate-pulse pl-6 border-l border-gray-700">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
                <div className="h-4 bg-gray-700 rounded w-5/6" />
              </div>
            ) : (
              <div className="flex flex-col">
                {paragraphs.map((paragraph, index) => (
                  <div key={paragraph} className="flex mb-4 last:mb-2">
                    <div className="min-w-[2px] bg-gray-700 mr-4" />
                    <div className="flex-1">
                      <p>{paragraph}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-2 text-gray-400 mt-2 pl-6">
                  <CheckCircle className="size-5" />
                  <span>Done</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
