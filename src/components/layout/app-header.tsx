"use client";

import { Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "./user-nav";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        <Separator orientation="vertical" className="hidden h-5 sm:block" />

        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <span>Workspace</span>
          <span>/</span>
          <span className="font-medium text-foreground">Overview</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-9">
          <Search className="size-4" />
          <span className="sr-only">Search</span>
        </Button>

        <Button variant="ghost" size="icon" className="size-9">
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <UserNav />
      </div>
    </header>
  );
}
