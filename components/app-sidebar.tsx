"use client";

import {
  LayoutDashboard,
  type LucideIcon,
  Swords,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useNavigationItemsQuery } from "@/components/services/use-navigation-items.query";
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

// Icon mapping from string names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Trophy,
  Swords,
  User,
};

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname();

  // Fetch navigation items from API based on user roles
  const { data: navItems = [], isLoading } = useNavigationItemsQuery();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Trophy className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">1v1 Core</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Tournament Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span>Cargando...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                navItems.map((item) => {
                  // Get icon component from mapping, fallback to LayoutDashboard
                  const Icon = iconMap[item.icon] || LayoutDashboard;
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(`${item.href}/`);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
