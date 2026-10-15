"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useOrganization } from "@/components/providers/organization-provider";
import { useActivity } from "@/hooks/useActivity";
import { mainNavigation, settingsNavigation } from "@/config/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { UserNav } from "./user-nav";
import { CreateOrganizationDialog } from "./create-organization-dialog";

const navigationItems = [...mainNavigation, ...settingsNavigation];
type GlobalSearchItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

type GlobalSearchData = {
  applications: GlobalSearchItem[];
  subscriptions: GlobalSearchItem[];
  vendors: GlobalSearchItem[];
  licenses: GlobalSearchItem[];
  expenses: GlobalSearchItem[];
};
function formatActivityTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AppHeader() {
  const {
    organizations,
    selectedOrganization,
    isLoading,
    error,
    selectOrganization,
  } = useOrganization();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchData | null>(
    null,
  );
  const [isGlobalSearchLoading, setIsGlobalSearchLoading] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState("");
  const activityQuery = useActivity({ page: 1, limit: 5 });
  const recentActivities = activityQuery.data?.data?.activities ?? [];
  const filteredNavigation = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return navigationItems;
    }

    return navigationItems.filter((item) =>
      item.title.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  useEffect(() => {
    const query = searchQuery.trim();
    const organizationId = selectedOrganization?.id;

    if (!isSearchOpen || query.length < 2 || !organizationId) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      setIsGlobalSearchLoading(true);
      setGlobalSearchError("");

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          {
            method: "GET",
            credentials: "same-origin",
            headers: {
              "x-organization-id": organizationId,
            },
            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Search failed.");
        }

        setSearchResults(result.data as GlobalSearchData);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setSearchResults(null);
        setGlobalSearchError("Unable to search right now. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setIsGlobalSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isSearchOpen, searchQuery, selectedOrganization?.id]);

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    setIsGlobalSearchLoading(false);
    setGlobalSearchError("");
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border/70 bg-background/90 px-3 backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <SidebarTrigger />

          <Separator orientation="vertical" className="hidden h-5 sm:block" />

          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500/15 via-violet-500/15 to-cyan-500/15 ring-1 ring-indigo-500/15 sm:flex">
              <Building2 className="size-4 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div className="min-w-0">
              <label htmlFor="organization-switcher" className="sr-only">
                Select organization
              </label>

              <select
                id="organization-switcher"
                value={selectedOrganization?.id ?? ""}
                onChange={(event) => selectOrganization(event.target.value)}
                disabled={isLoading || organizations.length === 0}
                className="max-w-[150px] cursor-pointer truncate rounded-md border border-transparent bg-transparent py-1 pl-1 pr-6 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-[240px] sm:pl-2"
                aria-describedby={
                  error ? "organization-switcher-error" : undefined
                }
              >
                {isLoading && (
                  <option value="">Loading organizations...</option>
                )}

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
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {(selectedOrganization?.role === "owner" ||
            selectedOrganization?.role === "admin") && (
            <CreateOrganizationDialog />
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Search pages"
            title="Search pages"
            onClick={() => setIsSearchOpen(true)}
            className="size-9 rounded-xl transition-colors hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <Search className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Recent activity notifications"
                title="Recent activity"
                className="relative size-9 rounded-xl transition-colors hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400"
              >
                <Bell className="size-4" />

                {recentActivities.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 ring-2 ring-background" />
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-[min(360px,calc(100vw-24px))] rounded-2xl border-border/70 p-2 shadow-xl"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Recent activity</p>
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      Updates from your workspace
                    </p>
                  </div>

                  <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500/15 via-violet-500/15 to-cyan-500/15 text-indigo-600 dark:text-indigo-400">
                    <Activity className="size-4" />
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {activityQuery.isPending && (
                <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading recent activity...
                </div>
              )}

              {!activityQuery.isPending && activityQuery.isError && (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm font-medium">Could not load activity</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Please try again later.
                  </p>
                </div>
              )}

              {!activityQuery.isPending &&
                !activityQuery.isError &&
                recentActivities.length === 0 && (
                  <div className="px-3 py-8 text-center">
                    <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-muted">
                      <Bell className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      You&apos;re all caught up
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Workspace updates will appear here.
                    </p>
                  </div>
                )}

              {!activityQuery.isPending &&
                !activityQuery.isError &&
                recentActivities.map((activity) => (
                  <DropdownMenuItem
                    key={activity._id}
                    asChild
                    className="cursor-pointer rounded-xl px-3 py-3 focus:bg-indigo-500/5"
                  >
                    <Link
                      href="/activity"
                      className="flex w-full items-start gap-3"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
                        <Activity className="size-4" />
                      </span>

                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-sm font-medium">
                          {activity.title}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {activity.description}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatActivityTime(activity.createdAt)}
                        </span>
                      </span>

                      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="rounded-xl p-0">
                <Link
                  href="/activity"
                  className="flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400"
                >
                  View all activity
                  <ChevronRight className="size-4" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <UserNav />
        </div>
      </header>

      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSearch();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeSearch();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-search-title"
            className="mx-auto mt-[10vh] w-full max-w-xl overflow-hidden rounded-2xl border border-border/70 bg-popover shadow-2xl shadow-indigo-950/10"
          >
            <div className="flex items-center gap-3 border-b border-border/70 bg-gradient-to-r from-indigo-500/[0.06] via-violet-500/[0.04] to-cyan-500/[0.06] px-4">
              <Search className="size-5 shrink-0 text-indigo-500" />

              <label id="global-search-title" className="sr-only">
                Search workspace pages
              </label>

              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pages, applications, vendors..."
                aria-label="Search workspace"
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />

              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Clear search"
                  className="size-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-4" />
                </Button>
              )}

              <kbd className="hidden rounded-md border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground sm:inline-flex">
                ESC
              </kbd>
            </div>

            <div className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {searchQuery.trim().length < 2
                  ? "Quick navigation"
                  : "Search results"}
              </p>

              {searchQuery.trim().length < 2 ? (
                filteredNavigation.length > 0 ? (
                  filteredNavigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSearch}
                        className="group flex items-center gap-3 rounded-xl px-3 py-3 outline-none transition-colors hover:bg-gradient-to-r hover:from-indigo-500/10 hover:via-violet-500/5 hover:to-cyan-500/10 focus-visible:bg-muted"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-600">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {item.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            Open {item.title.toLowerCase()}
                          </span>
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    );
                  })
                ) : (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No pages found.
                  </p>
                )
              ) : (
                <>
                  {isGlobalSearchLoading && (
                    <div className="flex items-center gap-2 px-3 py-5 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Searching your workspace...
                    </div>
                  )}

                  {globalSearchError && (
                    <p
                      className="px-3 py-5 text-sm text-destructive"
                      role="alert"
                    >
                      {globalSearchError}
                    </p>
                  )}

                  {!isGlobalSearchLoading &&
                    !globalSearchError &&
                    searchResults &&
                    (() => {
                      const groups = [
                        {
                          title: "Applications",
                          items: searchResults.applications,
                        },
                        {
                          title: "Subscriptions",
                          items: searchResults.subscriptions,
                        },
                        { title: "Vendors", items: searchResults.vendors },
                        { title: "Licenses", items: searchResults.licenses },
                        { title: "Expenses", items: searchResults.expenses },
                      ];

                      const total = groups.reduce(
                        (count, group) => count + group.items.length,
                        0,
                      );

                      if (total === 0) {
                        return (
                          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                            No matching records found.
                          </p>
                        );
                      }

                      return groups.map(
                        (group) =>
                          group.items.length > 0 && (
                            <div key={group.title} className="mb-2">
                              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {group.title}
                              </p>

                              {group.items.map((item) => (
                                <Link
                                  key={item.id}
                                  href={item.href}
                                  onClick={closeSearch}
                                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors hover:bg-indigo-500/5 focus-visible:bg-muted"
                                >
                                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                                    <Search className="size-4" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                      {item.title}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                      {item.subtitle}
                                    </span>
                                  </span>
                                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                </Link>
                              ))}
                            </div>
                          ),
                      );
                    })()}

                  {!isGlobalSearchLoading &&
                    !globalSearchError &&
                    !searchResults &&
                    searchQuery.trim().length >= 2 && (
                      <p className="px-3 py-5 text-sm text-muted-foreground">
                        Preparing search...
                      </p>
                    )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-[11px] text-muted-foreground">
              <span>Opervia workspace search</span>
              <span>
                {searchQuery.trim().length < 2
                  ? `${filteredNavigation.length} pages`
                  : "Search across workspace records"}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-[11px] text-muted-foreground">
              <span>Opervia workspace search</span>
              <span>{filteredNavigation.length} pages</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
