import { useState } from "react";
import { Link, useRouterState, Outlet, useNavigate } from "@tanstack/react-router";
import { BookOpen, Library, User, PlusCircle, LogOut } from "lucide-react";
import { LogBookDialog } from "./LogBookDialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { AuthDialog } from "./AuthDialog";
import { LockedActionDialog } from "./LockedActionDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useStore();
  const { t, lang, toggle } = useI18n();
  const [authOpen, setAuthOpen] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);

  const nav = [
    { to: "/", label: t("nav_library"), Icon: Library, requiresAuth: false },
    { to: "/shelf", label: t("nav_shelf"), Icon: BookOpen, requiresAuth: false },
    { to: "/account", label: t("nav_account"), Icon: User, requiresAuth: false },
  ] as const;

  const guardedClick = (e: React.MouseEvent, requiresAuth: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      setLockedOpen(true);
    }
  };

  const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground max-w-full overflow-x-hidden">
      {/* Top header — desktop nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 min-h-16 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link to="/" className="flex items-baseline gap-2 min-w-0 flex-1 sm:flex-none">
            <span
              className="font-serif font-bold text-primary tracking-tight whitespace-nowrap truncate"
              style={{ fontSize: "clamp(0.95rem, 4vw, 1.5rem)" }}
            >
              {t("brand_name")}
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

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle language"
              className="rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap shrink-0"
            >
              <span className={lang === "en" ? "text-primary font-semibold" : ""}>EN</span>
              <span className="mx-1 text-muted-foreground">|</span>
              <span className={lang === "zh" ? "text-primary font-semibold" : ""}>中</span>
            </button>
            <LogBookDialog
              trigger={
                <Button size="sm" className="gap-1.5 rounded-full shadow-sm">
                  <PlusCircle className="size-4" />
                  <span className="hidden sm:inline">{t("contribute")}</span>
                </Button>
              }
            />
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Account menu"
                      className="rounded-full ring-1 ring-border hover:ring-primary/40 transition-shadow"
                    >
                      <Avatar className="size-9">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
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
                      <User className="size-4 mr-2" /> {t("nav_account")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate({ to: "/shelf" })}>
                      <BookOpen className="size-4 mr-2" /> {t("nav_shelf")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => logout()}>
                      <LogOut className="size-4 mr-2" /> {t("log_out")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button size="sm" className="rounded-full shadow-sm" onClick={() => setAuthOpen(true)}>
                {t("log_in")}
              </Button>
            )}
          </div>
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
