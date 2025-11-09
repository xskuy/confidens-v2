'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import useSWR from 'swr';
import Link from 'next/link';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    data: chatHistory,
    isLoading,
    mutate,
  } = useSWR<ChatHistory>(
    user && isClient ? `/api/history?limit=10` : null,
    fetcher,
    {
      fallbackData: { chats: [], hasMore: false },
      errorRetryCount: 0, // No reintentar cuando falle
      shouldRetryOnError: false, // No reintentar automáticamente
      revalidateOnFocus: false, // No revalidar cuando la ventana recibe foco
      revalidateOnReconnect: false, // No revalidar cuando se reconecte
    },
  );

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((prevData) => {
          if (prevData) {
            return {
              ...prevData,
              chats: prevData.chats.filter((chat) => chat.id !== deleteId),
            };
          }
          return prevData;
        });

        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  if (!user) {
    return (
      <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
        Login to save and revisit previous chats!
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="px-2 py-1 text-sm text-sidebar-foreground/50 font-medium">
          Recent
        </div>
        <div className="flex flex-col space-y-2">
          {[44, 32, 28, 64, 52].map((item) => (
            <div
              key={item}
              className="rounded-md h-11 flex gap-2 px-3 items-center"
            >
              <div
                className="h-5 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                style={
                  {
                    '--skeleton-width': `${item}%`,
                  } as React.CSSProperties
                }
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!chatHistory || chatHistory.chats.length === 0) {
    return (
      <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
        Your conversations will appear here once you start chatting!
      </div>
    );
  }

  const groupedChats = groupChatsByDate(chatHistory.chats);

  return (
    <>
      <div className="flex flex-col gap-3">
        {groupedChats.today.length > 0 && (
          <div>
            <div className="px-2 py-1 text-sm text-sidebar-foreground/50 font-medium">
              Today
            </div>
            <div className="space-y-2">
              {groupedChats.today.map((chat) => (
                <div key={chat.id} className="group/menu-item relative">
                  <div className="flex items-center">
                    <Link
                      href={`/chat/${chat.id}`}
                      onClick={() => setOpenMobile(false)}
                      className={`
                        flex items-center py-2 px-3 text-sm w-full rounded-md hover:bg-sidebar-accent
                        ${chat.id === id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                      `}
                    >
                      <span className="truncate">{chat.title}</span>
                    </Link>
                    <div className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-2 hover:bg-sidebar-accent rounded-md"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
                            onClick={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Eliminar chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedChats.yesterday.length > 0 && (
          <div>
            <div className="px-2 py-1 text-sm text-sidebar-foreground/50 font-medium">
              Yesterday
            </div>
            <div className="space-y-2">
              {groupedChats.yesterday.map((chat) => (
                <div key={chat.id} className="group/menu-item relative">
                  <div className="flex items-center">
                    <Link
                      href={`/chat/${chat.id}`}
                      onClick={() => setOpenMobile(false)}
                      className={`
                        flex items-center py-2 px-3 text-sm w-full rounded-md hover:bg-sidebar-accent
                        ${chat.id === id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                      `}
                    >
                      <span className="truncate">{chat.title}</span>
                    </Link>
                    <div className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-2 hover:bg-sidebar-accent rounded-md"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
                            onClick={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Eliminar chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedChats.lastWeek.length > 0 && (
          <div>
            <div className="px-2 py-1 text-sm text-sidebar-foreground/50 font-medium">
              Last 7 days
            </div>
            <div className="space-y-2">
              {groupedChats.lastWeek.map((chat) => (
                <div key={chat.id} className="group/menu-item relative">
                  <div className="flex items-center">
                    <Link
                      href={`/chat/${chat.id}`}
                      onClick={() => setOpenMobile(false)}
                      className={`
                        flex items-center py-2 px-3 text-sm w-full rounded-md hover:bg-sidebar-accent
                        ${chat.id === id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                      `}
                    >
                      <span className="truncate">{chat.title}</span>
                    </Link>
                    <div className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-2 hover:bg-sidebar-accent rounded-md"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
                            onClick={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Eliminar chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedChats.lastMonth.length > 0 && (
          <div>
            <div className="px-2 py-1 text-sm text-sidebar-foreground/50 font-medium">
              Last 30 days
            </div>
            <div className="space-y-2">
              {groupedChats.lastMonth.map((chat) => (
                <div key={chat.id} className="group/menu-item relative">
                  <div className="flex items-center">
                    <Link
                      href={`/chat/${chat.id}`}
                      onClick={() => setOpenMobile(false)}
                      className={`
                        flex items-center py-2 px-3 text-sm w-full rounded-md hover:bg-sidebar-accent
                        ${chat.id === id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                      `}
                    >
                      <span className="truncate">{chat.title}</span>
                    </Link>
                    <div className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-2 hover:bg-sidebar-accent rounded-md"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
                            onClick={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Eliminar chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedChats.older.length > 0 && (
          <div>
            <div className="px-2 py-1 text-sm text-sidebar-foreground/50 font-medium">
              Older
            </div>
            <div className="space-y-2">
              {groupedChats.older.map((chat) => (
                <div key={chat.id} className="group/menu-item relative">
                  <div className="flex items-center">
                    <Link
                      href={`/chat/${chat.id}`}
                      onClick={() => setOpenMobile(false)}
                      className={`
                        flex items-center py-2 px-3 text-sm w-full rounded-md hover:bg-sidebar-accent
                        ${chat.id === id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                      `}
                    >
                      <span className="truncate">{chat.title}</span>
                    </Link>
                    <div className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-2 hover:bg-sidebar-accent rounded-md"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
                            onClick={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Eliminar chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              tu chat y lo eliminará de nuestros servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
