'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function Greeting() {
  const { data: session } = useSession();
  const displayName = session?.user?.name || 'John';

  const [timeGreeting, setTimeGreeting] = useState('Hi there');

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setTimeGreeting('Hola');
    } else if (currentHour < 18) {
      setTimeGreeting('Hola');
    } else {
      setTimeGreeting('Hola');
    }
  }, []);

  return (
    <div className="w-full text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {/* Título principal minimalista */}
        <h1 className="text-4xl md:text-5xl font-light">
          <span className="bg-gradient-to-r from-yellow-600 via-yellow-400 to-orange-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
            {timeGreeting}, {displayName}
          </span>
        </h1>

        {/* Subtítulo */}
        <h2 className="text-3xl md:text-4xl font-light text-foreground">
          ¿Qué te gustaría saber?
        </h2>
      </motion.div>
    </div>
  );
}
