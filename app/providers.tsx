'use client';

import { SessionProvider } from 'next-auth/react';

type Props = {
  children?: React.ReactNode;
};

export const NextAuthProvider = ({ children }: Props) => {
  // You can add other client-side providers here if needed in the future
  return <SessionProvider>{children}</SessionProvider>;
};
