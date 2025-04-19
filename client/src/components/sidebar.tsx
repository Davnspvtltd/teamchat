import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  MessageSquare,
  Users,
  FolderClosed,
  Calendar,
  Settings,
  Sun,
  Moon,
  Menu,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (section: string) => void;
}

export default function Sidebar({ activeItem = "messages", onNavigate }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();

  // Handle navigation item clicks
  const handleNavClick = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name?: string): string => {
    if (!name) return user?.username?.substring(0, 2).toUpperCase() || "TC";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <aside className="hidden md:flex flex-col w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center pt-5 pb-5">
        {/* App Logo */}
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold mb-8">
          <span>TC</span>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col items-center space-y-4 mb-auto">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 rounded-lg",
              activeItem === "messages" &&
                "bg-gray-100 dark:bg-gray-700 text-primary dark:text-primary"
            )}
            onClick={() => handleNavClick("messages")}
            title="Messages"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 rounded-lg",
              activeItem === "contacts" &&
                "bg-gray-100 dark:bg-gray-700 text-primary dark:text-primary"
            )}
            onClick={() => handleNavClick("contacts")}
            title="Contacts"
          >
            <Users className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 rounded-lg",
              activeItem === "files" &&
                "bg-gray-100 dark:bg-gray-700 text-primary dark:text-primary"
            )}
            onClick={() => handleNavClick("files")}
            title="Files"
          >
            <FolderClosed className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 rounded-lg",
              activeItem === "calendar" &&
                "bg-gray-100 dark:bg-gray-700 text-primary dark:text-primary"
            )}
            onClick={() => handleNavClick("calendar")}
            title="Calendar"
          >
            <Calendar className="h-5 w-5" />
          </Button>
        </nav>

        {/* Profile & Settings Links */}
        <div className="flex flex-col items-center space-y-4 pt-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-lg"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 rounded-lg",
              activeItem === "settings" &&
                "bg-gray-100 dark:bg-gray-700 text-primary dark:text-primary"
            )}
            onClick={() => handleNavClick("settings")}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-10 h-10 rounded-full p-0" title="Profile">
                <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-700">
                  <AvatarImage src={user?.profilePicture} />
                  <AvatarFallback>
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
