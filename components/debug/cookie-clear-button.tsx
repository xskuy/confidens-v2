'use client';

import { Button } from '@/components/ui/button';
import { clearChatModelCookie } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function CookieClearButton() {
  const router = useRouter();

  const handleClearCookie = () => {
    clearChatModelCookie();
    console.log('Chat model cookie cleared successfully!');
    router.refresh(); // Recargar la página para reflejar los cambios
  };

  return (
    <Button
      onClick={handleClearCookie}
      variant="destructive"
      size="sm"
      className="text-xs"
    >
      Clear Model Cookie
    </Button>
  );
}
