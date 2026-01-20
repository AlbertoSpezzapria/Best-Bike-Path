import { Outlet } from "react-router-dom";
import AppSidebar, { MobileSidebar } from "./AppSidebar";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar className="hidden lg:flex" />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="lg:hidden p-4 border-b border-border flex items-center bg-card sticky top-0 z-10">
          <MobileSidebar />
          <span className="ml-3 font-display font-bold text-lg">BestBikePaths</span>
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
