import { Link, useRouterState } from "@tanstack/react-router";
import {
  FilePlus2,
  FolderKanban,
  GitCompareArrows,
  History,
  LayoutDashboard,
  UserRound,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppData } from "@/data/store";

const workItems = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard, exact: true },
  { title: "المشاريع", url: "/projects", icon: FolderKanban },
  { title: "طلب عميل جديد", url: "/requests/new", icon: FilePlus2 },
  { title: "كشف التغييرات", url: "/changes", icon: GitCompareArrows },
  { title: "سجل المشاريع", url: "/history", icon: History },
] as const;

const accountItems = [{ title: "الملف الشخصي والخدمات", url: "/profile", icon: UserRound }] as const;

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { profile } = useAppData();

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(`${url}/`);

  const closeOnMobile = () => isMobile && setOpenMobile(false);

  const renderItems = (items: ReadonlyArray<{ title: string; url: string; icon: typeof History; exact?: boolean }>) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title} className="h-10">
          <Link to={item.url} onClick={closeOnMobile}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-3">
        <Link to="/" className="flex items-center gap-2.5" onClick={closeOnMobile}>
          <div className="brand-mark flex size-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold">
            S
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-base font-bold tracking-wide text-primary">SCOPE</div>
              <div className="text-[11px] text-muted-foreground">مساعد نطاق العمل للمستقلين</div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        <SidebarGroup>
          <SidebarGroupLabel>العمل</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(workItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>الحساب</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(accountItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Link to="/profile" onClick={closeOnMobile} className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-sidebar-accent">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-soft text-sm font-semibold text-violet">
            {profile.full_name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium text-foreground">{profile.full_name}</div>
              <div className="truncate text-xs text-muted-foreground">{profile.specialty}</div>
            </div>
          )}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
