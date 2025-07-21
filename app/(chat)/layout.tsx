import type React from 'react';
import { cookies } from 'next/headers';
import Script from 'next/script';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/app/(auth)/auth';
import { DevModeProvider } from '@/context/dev-mode';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <div data-page="chat" className=" h-screen flex">
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <DevModeProvider>
          <AppSidebar user={session?.user} />
          {/* Aplicamos las mismas clases que funcionaron en settings */}
          <SidebarInset className="my-2 mr-2 rounded-xl overflow-hidden">
            <div className="flex flex-col bg-background h-full">{children}</div>
          </SidebarInset>
        </DevModeProvider>
      </SidebarProvider>
    </div>
  );
}
