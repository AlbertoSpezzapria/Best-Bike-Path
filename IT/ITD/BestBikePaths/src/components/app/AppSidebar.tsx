import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Route,
  Map,
  FolderOpen,
  Settings,
  Bike,
  LogOut,
  User,
  Menu,
  LogInIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";

import { getSidebarItems } from "@/config/navigation";

let isGuest = localStorage.getItem("guestMode") === "true";
const navItems = getSidebarItems(isGuest);

const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <Bike className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Best<span className="text-primary">Bike</span>Paths
          </span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app"}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground",
                "hover:bg-muted hover:text-foreground transition-all duration-200",
                isActive && "bg-primary/10 text-primary font-medium"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border">
        {!isGuest &&(
          <NavLink 
            to="/app/settings"
            onClick={onNavClick}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User"
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.user_metadata?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </NavLink>
        )}
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 mt-2 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
};

export const MobileSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80">
        <SidebarContent onNavClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};

const AppSidebar = ({ className }: { className?: string }) => {
  return (
    <aside className={cn("w-64 h-screen sticky top-0", className)}>
      <SidebarContent />
    </aside>
  );
};

export default AppSidebar;
