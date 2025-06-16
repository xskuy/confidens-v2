'use client';

import React, { useState, useRef, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Rocket, Lightbulb, Orbit } from 'lucide-react';
import {
  AI_MODELS_CONFIGURATION,
  type AIModelConfig,
  type PowerLevel,
} from '@/lib/ai/ai-models.config';

interface PowerSelectorProps {
  selectedPower: PowerLevel;
  onPowerChange: (power: PowerLevel) => void;
}

export default function PowerSelector({
  selectedPower,
  onPowerChange,
}: PowerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [currentView, setCurrentView] = useState<PowerLevel>(
    selectedPower || 'medium',
  );
  const [previousSelectedPower, setPreviousSelectedPower] =
    useState<PowerLevel>(selectedPower);

  // Actualizar previousSelectedPower cuando cambia selectedPower
  useEffect(() => {
    if (selectedPower !== previousSelectedPower) {
      setPreviousSelectedPower(selectedPower);
    }
  }, [selectedPower, previousSelectedPower]);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);

  // Definición de iconos y colores específicos de la UI para cada nivel
  const powerLevelUIDefinitions: Record<
    PowerLevel,
    {
      icon: React.ReactNode;
      colorIcon: string;
      colorText?: string; // Opcional, puede derivarse o definirse aquí
    }
  > = {
    low: {
      icon: <Rocket className="size-6" />,
      colorIcon: 'text-slate-300 dark:text-slate-200',
    },
    medium: {
      icon: <Lightbulb className="size-6" />,
      colorIcon: 'text-blue-400 dark:text-blue-300',
    },
    high: {
      icon: <Orbit className="size-6" />,
      colorIcon: 'text-amber-400 dark:text-amber-300',
    },
  };

  // Combina la configuración del modelo con las definiciones de UI
  const powerLevels: Record<
    PowerLevel,
    AIModelConfig & {
      icon: React.ReactNode;
      colorIcon: string;
      colorText?: string;
      label: string; // Asegura que label esté presente
    }
  > = Object.keys(AI_MODELS_CONFIGURATION).reduce(
    (acc, key) => {
      const level = key as PowerLevel;
      acc[level] = {
        ...AI_MODELS_CONFIGURATION[level], // Datos del modelo (id, name, description, etc.)
        ...powerLevelUIDefinitions[level], // Icono y colores de la UI
        label: AI_MODELS_CONFIGURATION[level].name, // Usa el nombre del modelo como label
      };
      return acc;
    },
    {} as Record<
      PowerLevel,
      AIModelConfig & {
        icon: React.ReactNode;
        colorIcon: string;
        colorText?: string;
        label: string;
      }
    >,
  );

  const handleDotClick = (level: PowerLevel) => {
    setCurrentView(level);
    onPowerChange(level);
  };

  // Position the popup relative to the button
  useEffect(() => {
    if (!open || !buttonRef.current || !popupRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const popupEl = popupRef.current;

    // Position the popup above the button
    popupEl.style.left = `${buttonRect.left + (buttonRect.width / 2) - popupEl.offsetWidth / 2}px`;
    popupEl.style.top = `${buttonRect.top - popupEl.offsetHeight - 10}px`;

    // Ensure the popup is visible within the viewport
    const popupRect = popupEl.getBoundingClientRect();

    if (popupRect.left < 20) {
      // If it goes off the left edge, adjust horizontal position
      popupEl.style.left = '20px';
    }

    if (popupRect.right > window.innerWidth - 20) {
      // If it goes off the right edge, adjust horizontal position
      popupEl.style.left = `${window.innerWidth - popupEl.offsetWidth - 20}px`;
    }

    if (popupRect.top < 20) {
      // If it goes off the top edge, position it below the button
      popupEl.style.top = `${buttonRect.bottom + 10}px`;
    }
  }, [open]);

  // Touch/mouse event handlers for swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startX.current === null) return;

      const currentX = e.touches[0].clientX;
      const diff = startX.current - currentX;

      if (Math.abs(diff) > 30) {
        const levels: PowerLevel[] = ['low', 'medium', 'high'];
        const currentIndex = levels.indexOf(currentView);

        if (diff > 0 && currentIndex < 2) {
          // Swiped left, move to next higher level
          setCurrentView(levels[currentIndex + 1]);
          onPowerChange(levels[currentIndex + 1]);
          startX.current = null;
        } else if (diff < 0 && currentIndex > 0) {
          // Swiped right, move to next lower level
          setCurrentView(levels[currentIndex - 1]);
          onPowerChange(levels[currentIndex - 1]);
          startX.current = null;
        }
      }
    };

    const handleTouchEnd = () => {
      startX.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentView, onPowerChange]);

  // Close popup when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Get current power level details
  const currentPowerDetails = powerLevels[selectedPower] || powerLevels.medium;

  const isHighPowerSelected = selectedPower === 'high';

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={{
          scale: selectedPower !== previousSelectedPower ? [1, 1.08, 1] : 1,
        }}
        transition={{
          duration: 0.4,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          whileHover={{
            scale: 1.02,
            y: -1,
          }}
          whileTap={{
            scale: 0.98,
            y: 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
            mass: 0.8,
          }}
        >
          <Button
            ref={buttonRef}
            onClick={() => setOpen(!open)}
            type="button"
            className={`
              h-9 px-4 rounded-full backdrop-blur-xl bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] hover:bg-white/[0.08] dark:hover:bg-white/[0.06] hover:border-white/[0.12] dark:hover:border-white/[0.10] flex items-center justify-center gap-2 transition-all duration-300 ease-out text-xs w-[120px] shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] text-white/[0.70] hover:text-white/[0.90] group
              ${
                isHighPowerSelected
                  ? 'bg-gradient-to-r from-amber-600/[0.25] via-yellow-500/[0.20] to-amber-700/[0.25] text-amber-200 border-amber-400/[0.30] hover:border-amber-300/[0.40] shadow-[0_4px_20px_rgba(245,158,11,0.25),0_1px_1px_rgba(255,255,255,0.08)_inset] hover:shadow-[0_8px_32px_rgba(245,158,11,0.35)]'
                  : ''
              }
            `}
            variant="ghost"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`icon-${selectedPower}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className={
                  isHighPowerSelected
                    ? 'text-amber-200'
                    : currentPowerDetails.colorIcon
                }
              >
                {React.cloneElement(
                  currentPowerDetails.icon as React.ReactElement,
                  { className: 'w-4 h-4' },
                )}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.span
                key={`text-${selectedPower}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className={`font-medium ${isHighPowerSelected ? 'text-amber-200' : 'text-white/[0.75] group-hover:text-white/[0.90]'}`}
              >
                {currentPowerDetails.label}
              </motion.span>
            </AnimatePresence>

            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </motion.div>
      </motion.div>

      {open && (
        <div
          ref={popupRef}
          className="fixed z-50 w-[320px] backdrop-blur-[28px] bg-black/[0.15] dark:bg-black/[0.25] border border-white/[0.12] dark:border-white/[0.08] rounded-3xl shadow-[0_20px_64px_rgba(0,0,0,0.35),0_1px_2px_rgba(255,255,255,0.08)_inset] hover:shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          style={{ top: '0', left: '0' }}
        >
          <div className="w-full" ref={containerRef}>
            <div className="p-6">
              {/* Dots navigation */}
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-[200px] h-9 backdrop-blur-[20px] bg-white/[0.06] dark:bg-white/[0.04] border border-white/[0.10] dark:border-white/[0.08] rounded-full relative flex items-center justify-between px-4 shadow-[0_4px_16px_rgba(0,0,0,0.20),0_1px_1px_rgba(255,255,255,0.06)_inset]">
                  {/* Thumb/handle deslizante blanco */}
                  <motion.div
                    className="absolute size-6 bg-gradient-to-br from-white/[0.95] to-white/[0.85] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.25),0_1px_2px_rgba(255,255,255,0.8)_inset] z-10 cursor-pointer backdrop-blur-sm"
                    style={{ top: '6px' }}
                    initial={false}
                    animate={{
                      left:
                        currentView === 'low'
                          ? '10%'
                          : currentView === 'medium'
                            ? '50%'
                            : '90%',
                      translateX: '-50%',
                      scale: [1, 1.15, 1],
                      boxShadow: [
                        '0_4px_12px_rgba(0,0,0,0.25),0_1px_2px_rgba(255,255,255,0.8)_inset',
                        '0_0_16px_4px_rgba(255,255,255,0.6),0_4px_12px_rgba(0,0,0,0.25),0_1px_2px_rgba(255,255,255,0.8)_inset',
                        '0_4px_12px_rgba(0,0,0,0.25),0_1px_2px_rgba(255,255,255,0.8)_inset',
                      ],
                    }}
                    transition={{
                      left: {
                        type: 'spring',
                        stiffness: 250,
                        damping: 25,
                        duration: 0.5,
                      },
                      scale: { duration: 0.5, times: [0, 0.5, 1] },
                      boxShadow: { duration: 0.5, times: [0, 0.5, 1] },
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDrag={undefined}
                    onDragEnd={(_, info) => {
                      const direction = info.offset.x > 0 ? 'right' : 'left';
                      const levels: PowerLevel[] = ['low', 'medium', 'high'];
                      const currentIndex = levels.indexOf(currentView);

                      if (direction === 'right' && currentIndex < 2) {
                        const nextLevel = levels[currentIndex + 1];
                        setCurrentView(nextLevel);
                        onPowerChange(nextLevel);
                      } else if (direction === 'left' && currentIndex > 0) {
                        const prevLevel = levels[currentIndex - 1];
                        setCurrentView(prevLevel);
                        onPowerChange(prevLevel);
                      }
                    }}
                  />

                  {/* Puntos (ahora solo indicadores visuales) */}
                  {(['low', 'medium', 'high'] as PowerLevel[]).map((level) => (
                    <motion.button
                      key={level}
                      type="button"
                      className={`size-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
                        currentView === level
                          ? 'bg-white/[0.60] shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
                          : 'bg-white/[0.25] hover:bg-white/[0.35] shadow-[0_1px_4px_rgba(0,0,0,0.15)]'
                      }`}
                      onClick={() => handleDotClick(level)}
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center py-6"
                >
                  {/* Power icon - Usa el icono de la UI combinada */}
                  <div className={`mb-8 ${currentPowerDetails.colorIcon}`}>
                    {currentPowerDetails.icon &&
                      React.cloneElement(
                        currentPowerDetails.icon as React.ReactElement,
                        { className: 'size-12' }, // Aumenta tamaño del icono en popup
                      )}
                  </div>

                  {/* Power level name - Usa el label (nombre del modelo) */}
                  <h3 className="text-2xl font-bold text-center mb-4 text-white/[0.95] dark:text-white/[0.90]">
                    {currentPowerDetails.label}
                  </h3>

                  {/* Description - Usa la descripción del modelo */}
                  <p className="text-white/[0.65] dark:text-white/[0.60] text-center text-sm px-6 mb-2 leading-relaxed">
                    {currentPowerDetails.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
