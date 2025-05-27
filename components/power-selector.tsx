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
      colorIcon: 'text-white',
    },
    medium: {
      icon: <Lightbulb className="size-6" />,
      colorIcon: 'text-blue-500',
    },
    high: {
      icon: <Orbit className="size-6" />,
      colorIcon: 'text-yellow-500',
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
              h-8 px-3 rounded-full border border-border hover:bg-muted/50 flex items-center justify-center gap-2 transition-all duration-300 ease-out text-xs w-[120px]
              ${
                isHighPowerSelected
                  ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-white border-amber-500'
                  : 'bg-background text-muted-foreground hover:text-foreground'
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
                    ? 'text-white'
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
                className={`font-medium ${isHighPowerSelected ? 'text-white' : ''}`}
              >
                {currentPowerDetails.label}
              </motion.span>
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>

      {open && (
        <div
          ref={popupRef}
          className="fixed z-50 w-[320px] bg-popover rounded-xl shadow-lg border"
          style={{ top: '0', left: '0' }}
        >
          <div className="w-full" ref={containerRef}>
            <div className="p-4">
              {/* Dots navigation */}
              <div className="flex justify-center mb-4">
                <div className="w-full max-w-[200px] h-8 bg-muted rounded-full relative flex items-center justify-between px-4">
                  {/* Thumb/handle deslizante blanco */}
                  <motion.div
                    className="absolute size-5 bg-white rounded-full shadow-md z-10 cursor-pointer"
                    style={{ top: '5.5px' }}
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
                        '0 2px 4px rgba(0,0,0,0.1)',
                        '0 0 8px 2px rgba(255,255,255,0.6)',
                        '0 2px 4px rgba(0,0,0,0.1)',
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
                      className={`size-3 rounded-full ${currentView === level ? 'bg-primary-foreground/70' : 'bg-muted-foreground/50'}`}
                      onClick={() => handleDotClick(level)}
                      // Desactivar animación de pulso ya que ahora el foco visual es el thumb blanco
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
                  className="flex flex-col items-center justify-center py-4"
                >
                  {/* Power icon - Usa el icono de la UI combinada */}
                  <div className={`mb-6 ${currentPowerDetails.colorIcon}`}>
                    {currentPowerDetails.icon &&
                      React.cloneElement(
                        currentPowerDetails.icon as React.ReactElement,
                        { className: 'size-10' }, // Aumenta tamaño del icono en popup
                      )}
                  </div>

                  {/* Power level name - Usa el label (nombre del modelo) */}
                  <h3
                    className={`text-2xl font-bold text-center mb-4 ${currentPowerDetails.colorText || 'text-foreground'}`}
                  >
                    {currentPowerDetails.label}
                  </h3>

                  {/* Description - Usa la descripción del modelo */}
                  <p className="text-muted-foreground text-center text-sm px-6 mb-2">
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
