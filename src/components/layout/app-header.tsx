"use client";
import { Bell, Search, ChevronsUpDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useOrganization } from "@/components/providers/organization-provider";
import { UserNav } from "./user-nav";

export function AppHeader() {
  const {
    organizations,
    selectedOrganization,
    isLoading,
    error,
    selectOrganization,
  } = useOrganization();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />

        <Separator orientation="vertical" className="hidden h-5 sm:block" />

        <div className="flex min-w-0 items-center gap-2">
          <Building2 className="hidden size-4 shrink-0 text-muted-foreground sm:block" />

          <div className="min-w-0">
            <label htmlFor="organization-switcher" className="sr-only">
              Select organization
            </label>

            <select
              id="organization-switcher"
              value={selectedOrganization?.id ?? ""}
              onChange={(event) => selectOrganization(event.target.value)}
              disabled={isLoading || organizations.length === 0}
              className="max-w-[180px] cursor-pointer truncate rounded-md border border-transparent bg-transparent py-1 pl-2 pr-7 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-[240px]"
              aria-describedby={
                error ? "organization-switcher-error" : undefined
              }
            >
              {isLoading && <option value="">Loading organizations...</option>}

              {!isLoading && organizations.length === 0 && (
                <option value="">No organizations available</option>
              )}

              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>

            {error && (
              <p
                id="organization-switcher-error"
                className="sr-only"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <ChevronsUpDown className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
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
