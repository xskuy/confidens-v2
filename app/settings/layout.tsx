import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import { DevModeProvider } from '@/context/dev-mode';

export const metadata: Metadata = {
  title: 'Configuración | Confidens',
  description:
    'Gestiona tu perfil, conecta servicios externos y personaliza tu experiencia en Confidens.',
  keywords: [
    'configuración',
    'perfil',
    'GitHub',
    'Slack',
    'preferencias',
    'seguridad',
  ],
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <div data-page="settings">
      <SidebarProvider defaultOpen={!isCollapsed}>
        <DevModeProvider>
          <AppSidebar user={session?.user} />
          <SidebarInset>
            <div className="flex flex-col bg-background p-4 overflow-y-auto h-full">
              {children}
            </div>
          </SidebarInset>
        </DevModeProvider>
      </SidebarProvider>
    </div>
  );
}
