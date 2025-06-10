'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { memo, useState, useEffect, useRef } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import {
  FileText,
  Code,
  Palette,
  Search,
  Sparkles,
  Brain,
  BookOpen,
  ChevronDown,
} from 'lucide-react';

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = [
    {
      title: 'Summary',
      icon: <FileText className="size-4" />,
      options: [
        'Summarize the French Revolution',
        'Summarize the plot of Inception',
        'Summarize World War II in 5 sentences',
        'Summarize the benefits of meditation',
        'Summarize the key points of this document',
        'Summarize the latest AI developments',
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
        'Create a REST API endpoint',
        'Write unit tests for this function',
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
        'Create wireframes for e-commerce site',
        'Design a logo concept',
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
        'Research best practices for remote work',
        'Study the impact of social media',
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
        'Motivational quotes for productivity',
        'Art and design inspiration',
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
        'Analyze complex moral dilemmas',
        'Explore different perspectives on climate change',
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
        'Basic principles of good design',
        'Introduction to data science',
      ],
    },
  ];

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!expandedCategory) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setExpandedCategory(null);
      }
    };

    // Agregar listener al documento
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedCategory]);

  const handleCategoryClick = (
    event: React.MouseEvent,
    categoryTitle: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (expandedCategory === categoryTitle) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryTitle);
    }
  };

  const handleOptionClick = async (
    event: React.MouseEvent<HTMLDivElement>,
    option: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    window.history.replaceState({}, '', `/chat/${chatId}`);
    append({
      role: 'user',
      content: option,
    });
    setExpandedCategory(null);
  };

  if (!isHydrated) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center space-y-4"
    >
      {/* Botones de categorías */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-3 max-w-4xl"
      >
        {categories.map((category, index) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="relative"
          >
            <Button
              variant="outline"
              onClick={(event) => handleCategoryClick(event, category.title)}
              className={`flex items-center gap-2 px-4 py-2 h-auto rounded-full border transition-all duration-200 text-sm font-medium ${
                expandedCategory === category.title
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/20 bg-background/50 backdrop-blur-sm hover:bg-muted/80 hover:border-border/40'
              }`}
            >
              <span className="text-muted-foreground">{category.icon}</span>
              {category.title}
              <ChevronDown
                className={`size-3 transition-transform duration-200 ${
                  expandedCategory === category.title ? 'rotate-180' : ''
                }`}
              />
            </Button>

            {/* Menú desplegable */}
            <AnimatePresence>
              {expandedCategory === category.title && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-80 bg-popover border border-border rounded-2xl shadow-lg z-50 p-2"
                >
                  <div className="space-y-1">
                    {category.options.map((option, optionIndex) => (
                      <motion.div
                        key={option}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * optionIndex }}
                        onClick={(event) => handleOptionClick(event, option)}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-sm text-foreground/80 hover:text-foreground cursor-pointer"
                      >
                        {option}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      {/* Texto descriptivo al final */}
    </div>
  );
}

export interface SuggestedActionsProps extends Pick<UseChatHelpers, 'append'> {
  chatId: string;
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
