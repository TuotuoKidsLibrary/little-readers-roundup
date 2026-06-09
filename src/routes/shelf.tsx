import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore, CURRENT_USER_ID } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { BookCard } from "@/components/BookCard";
import { BookDetailSheet } from "@/components/BookDetailSheet";
import { LogBookDialog } from "@/components/LogBookDialog";
import { AuthDialog } from "@/components/AuthDialog";
import type { Book } from "@/lib/types";
import { Send, ArrowLeft, BookOpen, Activity, MessageSquare, History } from "lucide-react";

export const Route = createFileRoute("/shelf")({
  head: () => ({
    meta: [
      { title: "My Shelf & Activity — 小书阁" },
      { name: "description", content: "Your contributions, messages and exchange history." },
    ],
  }),
  component: ShelfPage,
});

function ShelfPage() {
  const { books, activity, isAuthenticated } = useStore();
  const { t } = useI18n();
  const ownerId = isAuthenticated ? CURRENT_USER_ID : "guest_user";
  const mine = useMemo(() => books.filter((b) => b.owner_id === ownerId), [books, ownerId]);
  const activeLoans = mine.filter((b) => b.status === "reserved").length;
  const [selected, setSelected] = useState<Book | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6">
      {!isAuthenticated && (
        <div className="mb-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-accent/40 via-card to-background p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-foreground/80 flex-1 leading-relaxed">
            <span className="mr-1">👋</span>
            {t("shelf_guest_banner")}
          </p>
          <AuthDialog
            trigger={
              <Button size="sm" className="rounded-full shadow-sm shrink-0">
                {t("create_account")}
              </Button>
            }
          />
        </div>
      )}
      <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold mb-1 whitespace-nowrap">{t("shelf_title")}</h1>
      <p className="text-sm text-muted-foreground mb-5">{t("shelf_subtitle")}</p>

      <Tabs defaultValue="contrib" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-muted/60 rounded-full p-1 h-auto">
          <TabsTrigger value="contrib" className="rounded-full gap-1.5 py-2 text-xs sm:text-sm">
            <BookOpen className="size-4" /> {t("tab_contrib")}
          </TabsTrigger>
          <TabsTrigger value="msg" className="rounded-full gap-1.5 py-2 text-xs sm:text-sm">
            <MessageSquare className="size-4" /> {t("tab_msg")}
          </TabsTrigger>
          <TabsTrigger value="hist" className="rounded-full gap-1.5 py-2 text-xs sm:text-sm">
            <History className="size-4" /> {t("tab_history")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contrib" className="pt-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <StatCard label={t("total_contributed")} value={mine.length} Icon={BookOpen} />
            <StatCard label={t("active_loans")} value={activeLoans} Icon={Activity} />
          </div>
          {mine.length === 0 ? (
            <EmptyState text={t("shelf_empty")} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mine.map((b) => (
                <LogBookDialog
                  key={b.id}
                  bookToEdit={b}
                  trigger={
                    <div className="w-full text-left">
                      <BookCard book={b} />
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="msg" className="pt-5">
          <MessagesPanel />
        </TabsContent>

        <TabsContent value="hist" className="pt-5">
          {activity.length === 0 ? (
            <EmptyState text={t("no_exchanges")} />
          ) : (
            <ol className="relative border-l border-border ml-3 space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="ml-5">
                  <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-primary ring-4 ring-background" />
                  <Card className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {a.type} · {a.at}
                      </p>
                      <h3 className="font-serif font-bold">{a.book_title}</h3>
                      {a.method && <p className="text-xs text-muted-foreground">via {a.method}</p>}
                    </div>
                    <Badge variant="secondary">{a.status}</Badge>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>

      <BookDetailSheet book={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}

function StatCard({ label, value, Icon }: { label: string; value: number
