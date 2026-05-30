import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import { BookOpen, Library, User, PlusCircle } from "lucide-react";
import { LogBookDialog } from "./LogBookDialog";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Library", Icon: Library },
  { to: "/shelf", label: "My Shelf", Icon: BookOpen },
  { to: "/account", label: "Account", Icon: User },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top header — desktop nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif font-bold">
              书
            </span>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-serif font-bold text-sm">Borrow, Sell & Share Chinese Children's Books</span>
              <span className="text-[11px] text-muted-foreground">中文绘本分享</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            {nav.map(({ to, label, Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <LogBookDialog
              trigger={
                <Button size="sm" className="gap-1.5 rounded-full shadow-sm">
                  <PlusCircle className="size-4" />
                  <span className="hidden sm:inline">Contribute</span>
                </Button>
              }
            />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* Bottom dock — mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="grid grid-cols-3 px-2 py-2 gap-1 safe-area">
          {nav.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}