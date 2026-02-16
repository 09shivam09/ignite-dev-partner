/**
 * App shell layout with sidebar for authenticated pages.
 * Mobile: no sidebar, just content.
 */
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0">
        <MobileNav />
        {children}
      </main>
    </div>
  );
};
