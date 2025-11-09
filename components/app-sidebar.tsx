// components/app-sidebar.tsx
'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  MessageCircle,
  FolderOpen,
  Settings,
  CheckSquare,
  Package,
  Clock,
  LifeBuoy,
  Send,
} from 'lucide-react';
import Link from 'next/link';

import { LogoIcon } from '@/components/icons';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navUserData = user
    ? {
        name: user.name ?? 'User',
        email: user.email ?? 'No Email',
        avatar: user.image ?? `https://avatar.vercel.sh/${user.email}`,
      }
    : null;

  const data = {
    navMain: [
      {
        title: 'Nuevo Chat',
        url: '/',
        icon: MessageCircle,
        isActive: pathname === '/' || pathname.startsWith('/chat'),
      },
      {
        title: 'Documentos RAG',
        url: '/rag-test',
        icon: FolderOpen,
        isActive: pathname.startsWith('/rag-test'),
      },
      {
        title: 'Proyectos',
        url: '/projects',
        icon: Package,
        isActive: pathname === '/projects',
      },
      {
        title: 'Tareas',
        url: '/tasks',
        icon: CheckSquare,
        isActive: pathname === '/tasks',
      },
      {
        title: 'Historial',
        url: '#',
        icon: Clock,
        isActive: false,
        items: 'history' as const, // Marcador especial para renderizar historial
      },
    ],
    navSecondary: [
      {
        title: 'Configuración',
        url: '/settings',
        icon: Settings,
      },
      {
        title: 'Soporte',
        url: '#',
        icon: LifeBuoy,
      },
      {
        title: 'Feedback',
        url: '#',
        icon: Send,
      },
    ],
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/"
                onClick={() => setOpenMobile(false)}
                className="flex items-center gap-2"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LogoIcon size={16} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Confidens</span>
                  <span className="truncate text-xs">AI Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} user={user} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {navUserData && <NavUser user={navUserData} />}
      </SidebarFooter>
    </Sidebar>
  );
}
