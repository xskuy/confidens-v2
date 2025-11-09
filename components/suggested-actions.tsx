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
      title: 'Resumen',
      icon: <FileText className="size-4" />,
      options: [
        'Resume la Revolución Francesa',
        'Resume la trama de Inception',
        'Resume la Segunda Guerra Mundial en 5 oraciones',
        'Resume los beneficios de la meditación',
      ],
    },
    {
      title: 'Código',
      icon: <Code className="size-4" />,
      options: [
        'Escribe una función de Python para ordenar arrays',
        'Crea un componente React para perfiles de usuario',
        'Ayúdame a depurar este error de JavaScript',
        'Explica cómo optimizar consultas SQL',
      ],
    },
    {
      title: 'Diseño',
      icon: <Palette className="size-4" />,
      options: [
        'Diseña un layout moderno para landing page',
        'Crea una paleta de colores para startup tech',
        'Diseña interfaz de usuario para app móvil',
        'Sugiere combinaciones de tipografía',
      ],
    },
    {
      title: 'Investigación',
      icon: <Search className="size-4" />,
      options: [
        'Investiga la historia de la inteligencia artificial',
        'Encuentra información sobre energías renovables',
        'Investiga tendencias del mercado de criptomonedas',
        'Analiza estrategias de la competencia',
      ],
    },
    {
      title: 'Inspiración',
      icon: <Sparkles className="size-4" />,
      options: [
        'Dame prompts creativos para escribir',
        'Sugiere ideas innovadoras de negocio',
        'Inspírame con historias de éxito',
        'Formas creativas de resolver problemas',
      ],
    },
    {
      title: 'Reflexión',
      icon: <Brain className="size-4" />,
      options: [
        'Analiza la ética del desarrollo de IA',
        'Explora la filosofía de la conciencia',
        'Examina el futuro del trabajo',
        'Discute el impacto de la tecnología en la sociedad',
      ],
    },
    {
      title: 'Aprendizaje',
      icon: <BookOpen className="size-4" />,
      options: [
        'Explica física cuántica en términos simples',
        'Enséñame conceptos básicos de programación',
        '¿Cómo funciona el machine learning?',
        'Explica las criptomonedas para principiantes',
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
