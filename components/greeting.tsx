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
      setTimeGreeting('Hi there');
    } else if (currentHour < 18) {
      setTimeGreeting('Hi there');
    } else {
      setTimeGreeting('Hi there');
    }
  }, []);

  return (
    <div className="w-full text-left">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {/* Título principal */}
        <h1 className="text-4xl md:text-5xl font-normal">
          <span className="bg-gradient-to-r from-yellow-600 via-yellow-400 to-orange-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
            {timeGreeting}, {displayName}
          </span>
        </h1>

        {/* Subtítulo */}
        <h2 className="text-4xl md:text-5xl font-normal text-foreground mb-6">
          What would like to know?
        </h2>

        {/* Descripción */}
        <p className="text-muted-foreground text-base max-w-md">
          Use one of the most common prompts below or use your own to begin
        </p>
      </motion.div>
    </div>
  );
}
