import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';

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
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset>
        <div className="min-h-screen bg-background">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
