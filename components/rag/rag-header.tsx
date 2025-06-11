import { SidebarToggle } from '@/components/sidebar-toggle';
import { ThemeToggle } from '@/components/theme-toggle';

export function RagHeader() {
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 justify-between border-b">
      <div className="flex items-center gap-2">
        <SidebarToggle />
      </div>
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </header>
  );
}
