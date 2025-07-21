// components/app-sidebar.tsx
'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';

import { PlusIcon, LogoIcon } from '@/components/icons';
import { Upload } from 'lucide-react';
import { SidebarHistory } from '@/components/sidebar-history';
import { NavUser } from './nav-user';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const navUserData = user
    ? {
        name: user.name ?? 'User',
        email: user.email ?? 'No Email',
        avatar: user.image ?? `https://avatar.vercel.sh/${user.email}`,
      }
    : null;

  return (
    <Sidebar variant="inset" className="border-r-0 shadow-none">
      <SidebarHeader className="border-b border-r-0">
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <LogoIcon size={28} />
              <span className="text-lg font-semibold hover:bg-muted rounded-md cursor-pointer">
                Confidens
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="border-r-0">
        {/* RAG System Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/rag-test'}
                  tooltip="Sistema RAG - Base de Conocimiento"
                >
                  <Link
                    href="/rag-test"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="size-4" />
                    <span>Sistema RAG</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Chat History Section */}
        <SidebarHistory user={user} />
      </SidebarContent>

      <SidebarFooter className="border-r-0 border-t">
        {navUserData && <NavUser user={navUserData} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
