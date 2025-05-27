import type React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
// Importa auth desde donde esté ubicado en tu proyecto
import { auth } from '@/app/(auth)/auth'; // Ajusta esta ruta según tu proyecto
import { DevModeProvider } from '@/context/dev-mode';

export const metadata: Metadata = {
  title: 'Configuración | Confidens',
  description:
    'Gestiona tu perfil, conecta servicios externos y personaliza tu experiencia en Confidens.',
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <div className="h-screen flex">
      <SidebarProvider defaultOpen={!isCollapsed}>
        <DevModeProvider>
          {/* Asegúrate de que el AppSidebar tenga la configuración correcta */}
          <AppSidebar user={session?.user} />

          {/* Este es el contenedor principal con los bordes redondeados */}
          <SidebarInset className="my-2 mr-2 rounded-xl overflow-hidden">
            <div className="flex flex-col bg-background h-full overflow-y-auto">
              {children}
            </div>
          </SidebarInset>
        </DevModeProvider>
      </SidebarProvider>
    </div>
  );
}
