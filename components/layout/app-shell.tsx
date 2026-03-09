"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { StatusBar } from "@/components/layout/status-bar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-[100dvh] min-h-[100dvh] overflow-hidden bg-[var(--surface)] text-[var(--ink)]">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="app-shell-sidebar hidden min-h-0 shrink-0 lg:block">
            <Sidebar pathname={pathname} />
          </aside>

          {mobileOpen ? (
            <div className="fixed inset-0 z-modal bg-black/60 lg:hidden">
              <div className="h-full w-[86vw] max-w-[320px] border-r border-[var(--line-strong)] bg-[color:var(--surface-sidebar-mobile)] shadow-xl">
                <div className="flex justify-end p-4">
                  <Button
                    aria-label="Close navigation"
                    onClick={() => setMobileOpen(false)}
                    size="icon"
                    variant="secondary"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <Sidebar pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Topbar onOpenMenu={() => setMobileOpen(true)} />
            <main
              className={cn(
                "app-shell-main min-h-0 flex-1 overflow-x-hidden overflow-y-auto",
                pathname === "/chat" && "px-0 pb-0 pt-0 sm:px-0 lg:px-0"
              )}
              id="main-content"
            >
              {children}
            </main>
          </div>
        </div>

        <StatusBar />
      </div>
    </div>
  );
}
