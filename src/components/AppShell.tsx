import { useState } from "react";
import { Link, useRouterState, Outlet, useNavigate } from "@tanstack/react-router";
import { BookOpen, Library, User, PlusCircle, LogOut } from "lucide-react";
import { LogBookDialog } from "./LogBookDialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { AuthDialog } from "./AuthDialog";
import { LockedActionDialog } from "./LockedActionDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/", label: "Library", Icon: Library, requiresAuth: false },
  { to: "/shelf", label: "My Shelf", Icon: BookOpen, requiresAuth: true },
  { to: "/account", label: "Account", Icon: User, requiresAuth: true },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);

  const guardedClick = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      setLockedOpen(true);
    }
  };

  const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top header — desktop nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-baseline gap-2 shrink-0">
            <span className="font-serif font-bold text-xl sm:text-2xl text-primary tracking-tight">
              中文绘本馆
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            {nav.map(({ to, label, Icon, requiresAuth }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={(e) => guardedClick(e, requiresAuth)}
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
            {isAuthenticated ? (
              <>
                <LogBookDialog
                  trigger={
                    <Button size="sm" className="gap-1.5 rounded-full shadow-sm">
                      <PlusCircle className="size-4" />
                      <span className="hidden sm:inline">Contribute</span>
                    </Button>
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Account menu"
                      className="rounded-full ring-1 ring-border hover:ring-primary/40 transition-shadow"
                    >
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary text-primary-foreground font-serif font-bold text-sm">
                          {initials || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate({ to: "/account" })}>
                      <User className="size-4 mr-2" /> Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate({ to: "/shelf" })}>
                      <BookOpen className="size-4 mr-2" /> My Shelf
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => logout()}>
                      <LogOut className="size-4 mr-2" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-full"
                  onClick={() => setLockedOpen(true)}
                >
                  <PlusCircle className="size-4" />
                  <span className="hidden sm:inline">Contribute</span>
                </Button>
                <Button size="sm" className="rounded-full shadow-sm" onClick={() => setAuthOpen(true)}>
                  Log In
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2 -mt-1 hidden sm:block">
          <p className="text-[11px] text-muted-foreground">
            Our Shared Chinese Children's Library
          </p>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* Bottom dock — mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="grid grid-cols-3 px-2 py-2 gap-1 safe-area">
          {nav.map(({ to, label, Icon, requiresAuth }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={(e) => guardedClick(e, requiresAuth)}
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

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <LockedActionDialog
        open={lockedOpen}
        onOpenChange={setLockedOpen}
        onLogin={() => {
          setLockedOpen(false);
          setAuthOpen(true);
        }}
      />
    </div>
  );
}