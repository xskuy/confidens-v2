'use client';

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import type { UseChatHelpers } from '@ai-sdk/react';
import {
  FileText,
  Code,
  Palette,
  Search,
  Sparkles,
  Brain,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const categories = [
    {
      title: 'Summary',
      icon: <FileText className="size-4" />,
      options: [
        'Summarize the French Revolution',
        'Summarize the plot of Inception',
        'Summarize World War II in 5 sentences',
        'Summarize the benefits of meditation',
      ],
    },
    {
      title: 'Code',
      icon: <Code className="size-4" />,
      options: [
        'Write a Python function to sort arrays',
        'Create a React component for user profiles',
        'Debug this JavaScript error',
        'Explain how to optimize SQL queries',
      ],
    },
    {
      title: 'Design',
      icon: <Palette className="size-4" />,
      options: [
        'Design a modern landing page layout',
        'Create a color palette for a tech startup',
        'Design user interface for mobile app',
        'Suggest typography combinations',
      ],
    },
    {
      title: 'Research',
      icon: <Search className="size-4" />,
      options: [
        'Research the history of artificial intelligence',
        'Find information about renewable energy',
        'Research market trends in cryptocurrency',
        'Analyze competitor strategies',
      ],
    },
    {
      title: 'Get Inspired',
      icon: <Sparkles className="size-4" />,
      options: [
        'Give me creative writing prompts',
        'Suggest innovative business ideas',
        'Inspire me with success stories',
        'Creative ways to solve problems',
      ],
    },
    {
      title: 'Think Deeply',
      icon: <Brain className="size-4" />,
      options: [
        'Analyze the ethics of AI development',
        'Explore the philosophy of consciousness',
        'Examine the future of work',
        'Discuss the impact of technology on society',
      ],
    },
    {
      title: 'Learn Gently',
      icon: <BookOpen className="size-4" />,
      options: [
        'Explain quantum physics in simple terms',
        'Teach me basic programming concepts',
        'How does machine learning work?',
        'Explain cryptocurrency for beginners',
      ],
    },
  ];

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleCategoryClick = (categoryTitle: string) => {
    setSelectedCategory(categoryTitle);
  };

  const handleBackClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedCategory(null);
  };

  const handleOptionClick = async (event: React.MouseEvent, option: string) => {
    event.preventDefault();
    event.stopPropagation();

    window.history.replaceState({}, '', `/chat/${chatId}`);
    append({
      role: 'user',
      content: option,
    });
    setSelectedCategory(null);
  };

  if (!isHydrated) {
    return null;
  }

  const selectedCategoryData = categories.find(
    (cat) => cat.title === selectedCategory,
  );

  return (
    <div className="w-full max-w-3xl mx-auto min-h-[240px]">
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          // Vista de categorías
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center space-y-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-3 max-w-4xl"
            >
              {categories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Button
                    variant="outline"
                    type="button"
                    onClick={(event) => handleCategoryClick(category.title)}
                    className="group relative flex items-center gap-2 px-4 py-2.5 h-auto rounded-full backdrop-blur-xl transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out text-sm font-medium shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:scale-[1.02] active:scale-[0.98] bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground">
                      {React.cloneElement(category.icon as React.ReactElement, {
                        className: 'w-4 h-4',
                      })}
                    </span>
                    <span>{category.title}</span>

                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          // Vista de opciones de categoría seleccionada
          <motion.div
            key="category-options"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {/* Header con título y botón de volver - más compacto */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <Button
                  onClick={(event) => handleBackClick(event)}
                  variant="ghost"
                  type="button"
                  className="group relative p-3 rounded-full backdrop-blur-xl bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] text-muted-foreground hover:text-foreground hover:scale-105 active:scale-[0.95]"
                >
                  <ArrowLeft className="size-4" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    {React.cloneElement(
                      selectedCategoryData?.icon as React.ReactElement,
                      { className: 'w-4 h-4' },
                    )}
                  </span>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedCategoryData?.title}
                  </h2>
                </div>
              </div>
            </motion.div>

            {/* Lista de opciones compacta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-1.5"
            >
              {selectedCategoryData?.options.map((option, index) => (
                <motion.div
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * index }}
                  onClick={(event) => handleOptionClick(event, option)}
                  className="group relative py-2.5 px-3 rounded-lg backdrop-blur-xl bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out text-xs text-muted-foreground hover:text-foreground cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span className="relative z-10 leading-relaxed">
                    {option}
                  </span>
                  {/* Efecto de brillo sutil en hover */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  {/* Borde interno de brillo */}
                  <div className="absolute inset-0 rounded-lg border border-white/[0.10] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface SuggestedActionsProps extends Pick<UseChatHelpers, 'append'> {
  chatId: string;
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
