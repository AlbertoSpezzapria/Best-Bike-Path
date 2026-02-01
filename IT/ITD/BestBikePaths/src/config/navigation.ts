import {
  LayoutDashboard,
  Route,
  Map,
  FolderOpen,
  LogInIcon,
  User,
} from "lucide-react";

export type NavItem = {
  icon: any;
  label: string;
  to: string;
};

export const getNavItems = (isGuest: boolean): NavItem[] => {
  if (isGuest) {
    return [
      { icon: Map, label: "Explore", to: "/guest-app" },
      { icon: LogInIcon, label: "SignIn", to: "/" },
    ];
  }
  return [
    { icon: LayoutDashboard, label: "Dashboard", to: "/app" },
    { icon: Route, label: "Record", to: "/app/record" },
    { icon: Map, label: "Explore", to: "/app/explore" },
    { icon: FolderOpen, label: "My Paths", to: "/app/my-paths" },
    { icon: User, label: "Profile", to: "/app/settings" },
  ];
};

// Items specifically for the sidebar (excluding Profile as it's handled separately there usually, but we can unify if needed)
// For now, mirroring existing Sidebar behavior where Profile is separate at the bottom.
export const getSidebarItems = (isGuest: boolean): NavItem[] => {
    if (isGuest) {
        return [
          { icon: Map, label: "Explore Paths", to: "/guest-app" },
          { icon: LogInIcon, label: "SignIn", to: "/"}
        ];
      }
      return [
        { icon: LayoutDashboard, label: "Dashboard", to: "/app" },
        { icon: Route, label: "Record Path", to: "/app/record" },
        { icon: Map, label: "Explore Paths", to: "/app/explore" },
        { icon: FolderOpen, label: "My Paths", to: "/app/my-paths" },
      ];
}
