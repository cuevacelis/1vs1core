"use client";

import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useUserMeQuery } from "@/components/services/use-user-me.query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { client } from "@/lib/orpc/orpc.client";

interface UserProfile {
  id: number;
  name: string;
  short_name?: string;
  url_image?: string;
  role: { id: number; name: string; description?: string };
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Get current user data
  const { data: user, isLoading } = useUserMeQuery();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await client.auth.logout();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setIsLoggingOut(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Show loading state
  if (isLoading || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate text-xs text-muted-foreground">
                Cargando...
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const userProfile: UserProfile = user as UserProfile;
  const userName = userProfile.name || "Usuario";
  const userAvatar = userProfile.url_image || "";
  const userRole = userProfile.role?.name || "Usuario";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="rounded-lg">
                  {getUserInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {userRole}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="rounded-lg">
                    {getUserInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {userRole}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/perfil")}>
                <IconUserCircle />
                Mi Perfil
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              <IconLogout />
              {isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
