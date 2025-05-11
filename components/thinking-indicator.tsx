'use client';

import { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
  reasoning: string;
  isVisible: boolean;
}

export function ThinkingIndicator({
  reasoning,
  isVisible,
}: ThinkingIndicatorProps) {
  const [dots, setDots] = useState('');

  // Efecto para la animación de los puntos suspensivos
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return `${prev}.`;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="flex justify-center px-4 pb-2 md:pb-4 animate-in fade-in duration-300">
      <div className="w-full md:max-w-3xl p-4 border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-4 rounded-full bg-blue-500 animate-pulse" />
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Pensando{dots}
          </p>
        </div>

        {reasoning && (
          <div className="mt-2 overflow-auto max-h-[200px] scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-800">
            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
              {reasoning}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
