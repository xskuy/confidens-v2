import React from 'react';

// Layout específico para las rutas de autenticación.
// No incluye SidebarProvider ni otros elementos específicos de la app principal.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // El layout raíz (app/layout.tsx) ya provee <html>, <body>,
  // ThemeProvider, NextAuthProvider, etc.
  // Solo necesitamos renderizar el contenido específico de la página de auth.
  return <>{children}</>;
}
