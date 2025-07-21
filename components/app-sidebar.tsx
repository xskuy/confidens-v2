// components/app-sidebar.tsx
'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { PlusIcon, LogoIcon } from '@/components/icons';
import {
  MessageCircle,
  FolderOpen,
  CheckSquare,
  Package,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
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
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [historyOpen, setHistoryOpen] = useState(false);
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

  const navItems = [
    {
      title: 'Chat',
      icon: MessageCircle,
      url: '/',
      isActive: pathname === '/' || pathname.startsWith('/chat'),
    },
    {
      title: 'Files',
      icon: FolderOpen,
      url: '/rag-test',
      isActive: pathname.startsWith('/rag-test'),
    },
    {
      title: 'Tasks',
      icon: CheckSquare,
      url: '/tasks',
      isActive: pathname === '/tasks',
    },
    {
      title: 'Projects',
      icon: Package,
      url: '/projects',
      isActive: pathname === '/projects',
    },
  ];

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
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.title}
                  >
                    <Link
                      href={item.url}
                      onClick={() => setOpenMobile(false)}
                      className="flex items-center gap-3 py-4 px-3 text-lg"
                    >
                      <item.icon className="size-6" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* History Section with Accordion */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={false}
                  tooltip="History"
                  className="flex items-center gap-3 w-full py-4 px-3 text-lg"
                  onClick={() => setHistoryOpen(!historyOpen)}
                >
                  <Clock className="size-6" />
                  <span>History</span>
                  {isClient && historyOpen ? (
                    <ChevronDown className="size-6 ml-auto" />
                  ) : (
                    <ChevronRight className="size-6 ml-auto" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {isClient && historyOpen && (
              <div className="ml-4 mt-2">
                <SidebarHistory user={user} />
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-r-0 border-t">
        {navUserData && <NavUser user={navUserData} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
