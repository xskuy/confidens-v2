'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
  reasoningTime?: number; // Time in seconds
  defaultExpanded?: boolean;
}

export function useReasoning(
  reasoning: string /* showFullReasoning: boolean // No se usa más */,
) {
  /* 1. Dividir en párrafos, limpiar y descartar muy cortos */
  const paragraphs = useMemo(() => {
    return reasoning
      .split(/\n\s*\n/) // separa por líneas en blanco
      .map((p) => p.trim())
      .filter((p) => p.length >= 20); // evita ruido
  }, [reasoning]);

  /* 2. Conjunto de palabras clave */
  const keyTermsSet = useMemo(() => {
    const terms = [
      'en resumen',
      'conclusión',
      'final',
      'importante',
      'respuesta',
      'response idea',
      'possible response',
      'structure',
      'guidelines',
      'looking at',
      'structure my response',
      'possible response',
      'final response',
    ];
    return new Set(terms.map((t) => t.toLowerCase()));
  }, []);

  /* 3. Regex para inicios relevantes */
  const startsWithImportant =
    /^(final|possible|structure|guidelines|respuesta|response)/i;

  // Detectar bullets/viñetas
  const bulletRegex = /^(\s*[-•*]\s*)/;

  /* 4. Procesar y agrupar párrafos relacionados */
  const processedParagraphs = useMemo(() => {
    return paragraphs.map((paragraph) => {
      return paragraph.replace(/^(\s*[-•*]\s*)/, ''); // Elimina bullets si los hubiera
    });
  }, [paragraphs]);

  /* 5. Puntuación sencilla */
  const scoreParagraph = (p: string, index: number, total: number) => {
    let score = 0;
    if (index === 0) score += 5; // primero
    if (index === total - 1) score += 5; // último
    if ([...keyTermsSet].some((term) => p.toLowerCase().includes(term)))
      score += 3;
    if (startsWithImportant.test(p)) score += 3;
    return score;
  };

  /* 6. Selección de párrafos importantes */
  const importantParagraphs = useMemo(() => {
    const total = processedParagraphs.length;
    const scored = processedParagraphs.map((p, i) => ({
      p,
      score: scoreParagraph(p, i, total),
    }));
    const selected = scored.filter((s) => s.score > 0);
    return (
      selected.length
        ? selected
        : scored.sort((a, b) => b.score - a.score).slice(0, Math.min(3, total))
    ).map((s) => s.p);
  }, [processedParagraphs, keyTermsSet]);

  /* 7. Párrafos a mostrar */
  const displayedParagraphs = processedParagraphs;

  /* 8. Variantes para animación */
  const variants = {
    collapsed: { height: 0, opacity: 0, marginTop: 0, marginBottom: 0 },
    expanded: { height: 'auto', opacity: 1 },
  } as const;

  return {
    paragraphs: processedParagraphs,
    importantParagraphs,
    displayedParagraphs,
    variants,
  };
}

export function MessageReasoning({
  isLoading,
  reasoning,
  reasoningTime = 0,
  defaultExpanded = false,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const containerRef = useRef<HTMLDivElement>(null);
  const motionDivRef = useRef<HTMLDivElement>(null);
  const previousScrollTopRef = useRef<number | null>(null); // Para guardar el scrollTop del contenedor padre

  // Usar el hook useReasoning para procesar el texto
  const { paragraphs, importantParagraphs, displayedParagraphs, variants } =
    useReasoning(reasoning);

  // Función para toggle con prevención de scroll y logging
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Guardar el scrollTop del contenedor de chat ANTES de cambiar el estado
    const chatScrollContainer = document.getElementById(
      'chat-scroll-container',
    );
    if (chatScrollContainer) {
      previousScrollTopRef.current = chatScrollContainer.scrollTop;
      console.log(
        `[MessageReasoning] Saved chatScrollContainer.scrollTop: ${previousScrollTopRef.current} before toggle.`,
      );
    } else {
      console.warn(
        '[MessageReasoning] chat-scroll-container NOT FOUND before toggle.',
      );
      previousScrollTopRef.current = null; // Asegurarse de que esté nulo si no se encuentra
    }

    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (motionDivRef.current) {
      console.log(
        `[MessageReasoning] useEffect - isExpanded: ${isExpanded}, motionDiv height: ${motionDivRef.current.offsetHeight}px`,
      );
    }
  }, [isExpanded]);

  // No render si no hay contenido de razonamiento
  if (!reasoning && !isLoading) return null;

  return (
    <div
      ref={containerRef}
      className="reasoning-container relative"
      style={{
        margin: 0,
        marginBottom: isExpanded ? '0.5rem' : 0,
      }}
    >
      <button
        data-testid="message-reasoning-toggle"
        type="button"
        className="flex items-center gap-2 text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors w-full text-left py-0.5"
        onClick={handleToggleExpand}
        aria-expanded={isExpanded}
        aria-controls="reasoning-content"
      >
        <span className="text-sm font-medium">
          {isLoading ? 'Reasoning...' : 'Mostrar razonamiento'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isExpanded ? 'rotate-180' : 'rotate-0',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            ref={motionDivRef}
            id="reasoning-content"
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              overflow: 'hidden',
            }}
            className="no-scroll-anchor text-gray-700 dark:text-gray-300 text-sm mb-1 pb-1"
            tabIndex={-1}
            onAnimationComplete={(animationDefinition) => {
              console.log(
                `[MessageReasoning] onAnimationComplete - animationDefinition: ${animationDefinition}, current isExpanded (at start of callback): ${isExpanded}`,
              );
              const chatScrollContainer = document.getElementById(
                'chat-scroll-container',
              );

              if (!chatScrollContainer) {
                console.warn(
                  '[MessageReasoning] onAnimationComplete: chat-scroll-container NOT FOUND.',
                );
                // Si no encontramos el contenedor, no podemos hacer mucho para restaurar el scroll.
                // Limpiamos la referencia de scroll guardada.
                previousScrollTopRef.current = null;
                return;
              }

              if (animationDefinition === 'expanded' && isExpanded) {
                if (motionDivRef.current) {
                  console.log(
                    '[MessageReasoning] Animation to EXPANDED completed. Attempting focus trick.',
                  );
                  motionDivRef.current.focus({ preventScroll: true });
                }
                // Intento adicional: Restaurar el scroll si el focus no fue suficiente
                if (
                  previousScrollTopRef.current !== null &&
                  chatScrollContainer
                ) {
                  // Comprobamos si el scroll actual es muy diferente al que teníamos
                  // Esto es heurístico, podría necesitar ajuste
                  if (
                    Math.abs(
                      chatScrollContainer.scrollTop -
                        previousScrollTopRef.current,
                    ) > 50
                  ) {
                    // umbral de 50px
                    console.log(
                      `[MessageReasoning] Scroll position changed significantly after expand. Attempting to restore to ${previousScrollTopRef.current}. Current: ${chatScrollContainer.scrollTop}`,
                    );
                    chatScrollContainer.scrollTop =
                      previousScrollTopRef.current;
                  }
                }
              } else if (animationDefinition === 'collapsed') {
                console.log(
                  `[MessageReasoning] Animation to COLLAPSED completed. previousScrollTopRef: ${previousScrollTopRef.current}`,
                );
                if (previousScrollTopRef.current !== null) {
                  chatScrollContainer.scrollTop = previousScrollTopRef.current;
                  console.log(
                    `[MessageReasoning] Restored chatScrollContainer.scrollTop to: ${previousScrollTopRef.current} after collapse.`,
                  );
                }
              }
              // Limpiar el scrollTop guardado después de su uso o si la condición no coincidió.
              previousScrollTopRef.current = null;
            }}
          >
            {isLoading ? (
              <div className="flex flex-col gap-1 animate-pulse pl-2 border-l border-gray-300 dark:border-gray-700">
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
              </div>
            ) : (
              <div className="pl-4 relative">
                {/* Línea vertical fina extendida con soporte para temas */}
                <div className="absolute left-0 top-0 bottom-[-3px] w-px bg-gray-300 dark:bg-gray-600" />

                {/* Párrafos sin puntos */}
                <div className="flex flex-col space-y-4">
                  {displayedParagraphs.map((paragraph, index) => (
                    <div
                      key={`paragraph-${index}-${paragraph.substring(0, 20)}`}
                      className="w-full"
                    >
                      <p className="text-sm italic">{paragraph}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
