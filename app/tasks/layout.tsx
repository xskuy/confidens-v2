import type React from 'react';
import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/app/(auth)/auth';
import { DevModeProvider } from '@/context/dev-mode';

export default async function TasksLayout({
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
          <AppSidebar user={session?.user} />
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
