import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNavigation } from "./BottomNavigation";

interface AppLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export const AppLayout = ({ children, showBottomNav = true }: AppLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 pb-20 md:pb-6">{children}</main>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};
