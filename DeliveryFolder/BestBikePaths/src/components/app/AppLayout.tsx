import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar className="hidden lg:flex" />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header - Optional, for branding/context */}
        <div className="lg:hidden p-4 border-b border-border flex items-center justify-center bg-card sticky top-0 z-10 shadow-sm">
           <span className="font-display font-bold text-lg">Best<span className="text-primary">Bike</span>Paths</span>
        </div>
        
        <div className="flex-1 overflow-auto pb-24 lg:pb-0">
          <Outlet />
        </div>
        
        <MobileBottomNav />
      </main>
    </div>
  );
};

export default AppLayout;
