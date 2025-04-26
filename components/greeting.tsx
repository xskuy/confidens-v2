'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function Greeting() {
  const { data: session } = useSession();
  const displayName = session?.user?.name;

  const [timeGreeting, setTimeGreeting] = useState('Hello there');

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setTimeGreeting('Good morning,');
    } else if (currentHour < 18) {
      setTimeGreeting('Good afternoon,');
    } else {
      setTimeGreeting('Good evening,');
    }
  }, []);

  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        {timeGreeting}
        {displayName ? (
          <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            {` ${displayName}`}
          </span>
        ) : (
          ''
        )}
        !
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        How can I help you today?
      </motion.div>
    </div>
  );
}
