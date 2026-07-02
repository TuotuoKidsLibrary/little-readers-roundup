import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { BookCard } from "@/components/BookCard";
import { BookDetailSheet } from "@/components/BookDetailSheet";
import { LogBookDialog } from "@/components/LogBookDialog";
import { AuthDialog } from "@/components/AuthDialog";
import type { Book } from "@/lib/types";
import { Send, BookOpen, Activity, MessageSquare, History, CheckCircle, XCircle, Heart, Trash2, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/shelf")({
  head: () => ({
    meta: [
      { title: "My Shelf & Activity — 我的书架和分享情况" },
      { name: "description", content: "Your contributions, messages and exchange history." },
    ],
  }),
  component: ShelfPage,
});

function ShelfPage() {
  const { books, requests, user, isAuthenticated, savedBookIds, toggleSaveBook, deleteBook, totalUnread } = useStore();
  const { t } = useI18n();
  const mine = useMemo(
    () => (isAuthenticated ? books.filter((b) => b.owner_id === user.id) : []),
    [books, user.id, isAuthenticated],
  );
  const favorites = useMemo(
    () => books.filter((b) => savedBookIds.includes(b.id)),
    [books, savedBookIds],
  );
  const activeLoans = mine.filter((b) => b.status === "reserved").length;
  const [selected, setSelected] = useState<Book | null>(null);

  const activity = useMemo(
    () =>
      requests.map((r) => ({
        id: r.id,
        type: r.owner_id === user.id ? ("lend" as const) : ("borrow" as const),
        book_title: r.book_title,
        at: new Date(r.created_at).toLocaleDateString(),
        method: r.method,
        status: r.status,
      })),
    [requests, user.id],
  );

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
        <TabsList className="w-full grid grid-cols-4 bg-muted/60 rounded-full p-1 h-auto">
          <TabsTrigger value="contrib" className="rounded-full gap-1.5 py-2 text-xs sm:text-sm">
            <BookOpen className="size-4" /> {t("tab_contrib")}
          </TabsTrigger>
          <TabsTrigger value="fav" className="rounded-full gap-1.5 py-2 text-xs sm:text-sm">
            <Heart className="size-4" /> {t("tab_favorites")}
          </TabsTrigger>
          <TabsTrigger value="msg" className="rounded-full gap-1.5 py-2 text-xs sm:text-sm relative">
            <MessageSquare className="size-4" /> {t("tab_msg")}
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
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
                <div key={b.id} className="relative group">
                  <LogBookDialog
                    bookToEdit={b}
                    trigger={
                      <div className="w-full text-left">
                        <BookCard book={b} />
                      </div>
                    }
                  />
                  <button
                    type="button"
                    aria-label={t("delete")}
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (window.confirm(t("delete_confirm"))) {
                        await deleteBook(b.id);
                      }
                    }}
                    className="absolute top-3 right-3 rounded-full bg-background/90 border border-border p-1.5 shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-muted-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fav" className="pt-5">
          {favorites.length === 0 ? (
            <EmptyState text={t("favorites_empty")} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favorites.map((b) => (
                <div key={b.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className="w-full text-left"
                  >
                    <BookCard book={b} />
                  </button>
                  <button
                    type="button"
                    aria-label={t("remove_from_favorites")}
                    onClick={(e) => { e.stopPropagation(); toggleSaveBook(b.id); }}
                    className="absolute top-3 right-3 rounded-full bg-background/90 border border-border p-1.5 shadow-sm hover:bg-muted"
                  >
                    <Heart className="size-4 fill-red-500 text-red-500" />
                  </button>
                </div>
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
                <ActivityItem key={a.id} item={a} />
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>

      <BookDetailSheet book={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}

function MessagesPanel() {
  const { threads, messages, requests, user, sendMessage, isAuthenticated, unreadByThread, markThreadRead } = useStore();
  const { t } = useI18n();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((th) => th.id === activeThreadId) ?? threads[0];

  useEffect(() => {
    if (activeThread) markThreadRead(activeThread.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThread?.id, messages.length]);

  const threadMessages = activeThread
    ? messages
        .filter((m) => m.request_id === activeThread.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];
  const request = activeThread ? requests.find((r) => r.id === activeThread.id) : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages.length]);

  if (!isAuthenticated) {
    return <EmptyState text={t("log_in_to_see_conversations")} />;
  }

  if (threads.length === 0) {
    return <EmptyState text={t("no_conversations_start")} />;
  }

  const handleSend = async () => {
    if (!draft.trim() || sending || !activeThread) return;
    setSending(true);
    const { error } = await sendMessage(activeThread.id, draft.trim());
    setSending(false);
    if (!error) setDraft("");
  };

  return (
    <div className="grid sm:grid-cols-[220px_1fr] gap-4 min-h-[360px]">
      <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible">
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveThreadId(t.id); setDraft(""); }}
            className={`relative text-left rounded-xl border p-3 shrink-0 sm:shrink min-w-[180px] sm:min-w-0 transition-colors ${
              t.id === activeThread.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
            }`}
          >
            <p className="text-sm font-medium truncate">{t.book_title}</p>
            <p className="text-xs text-muted-foreground truncate">{t.other_user_name}</p>
            <p className="text-xs text-muted-foreground truncate mt-1">{t.last_message}</p>
            {unreadByThread[t.id] > 0 && (
              <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadByThread[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="flex flex-col p-4 gap-3">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Avatar className="size-9">
            <AvatarFallback>{activeThread.other_user_name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{activeThread.other_user_name}</p>
            <p className="text-xs text-muted-foreground">{activeThread.book_title}</p>
          </div>
          {request && <Badge variant="secondary" className="ml-auto capitalize">{request.status}</Badge>}
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-72 min-h-[160px]">
          {threadMessages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {t("no_messages_in_thread")}
            </p>
          ) : (
            threadMessages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.sender_id === user.id
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted"
                }`}
              >
                {m.text}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t("write_message_placeholder")}
            className="rounded-full"
          />
          <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={sending || !draft.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ActivityItem({ item }: { item: { id: string; type: "lend" | "borrow"; book_title: string; at: string; method: string; status: string } }) {
  const { updateRequestStatus } = useStore();
  const { t } = useI18n();
  const [loading, setLoading] = useState<"accept" | "decline" | "complete" | null>(null);

  const handleAccept = async () => {
    setLoading("accept");
    await updateRequestStatus(item.id, "accepted");
    setLoading(null);
  };

  const handleDecline = async () => {
    setLoading("decline");
    await updateRequestStatus(item.id, "declined");
    setLoading(null);
  };

  const handleComplete = async () => {
    setLoading("complete");
    await updateRequestStatus(item.id, "completed");
    setLoading(null);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    declined: "bg-red-50 text-red-700 border-red-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <li className="ml-5">
      <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-primary ring-4 ring-background" />
      <Card className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {item.type === "lend" ? t("incoming_request") : t("your_request")} · {item.at}
            </p>
            <h3 className="font-serif font-bold">{item.book_title}</h3>
            {item.method && <p className="text-xs text-muted-foreground capitalize">via {item.method}</p>}
          </div>
          <Badge variant="outline" className={`capitalize shrink-0 ${statusColors[item.status] ?? ""}`}>
            {item.status}
          </Badge>
        </div>

        {item.type === "lend" && item.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleDecline}
              disabled={!!loading}
            >
              <XCircle className="size-4" />
              {loading === "decline" ? t("declining") : t("decline")}
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAccept}
              disabled={!!loading}
            >
              <CheckCircle className="size-4" />
              {loading === "accept" ? t("accepting") : t("accept")}
            </Button>
          </div>
        )}

        {item.status === "accepted" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={handleComplete}
              disabled={!!loading}
            >
              <PackageCheck className="size-4" />
              {loading === "complete" ? "…" : t("mark_completed")}
            </Button>
          </div>
        )}
      </Card>
    </li>
  );
}

function StatCard({ label, value, Icon }: { label: string; value: any; Icon: any }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
      <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="size-14 rounded-full bg-muted flex items-center justify-center">
        <BookOpen className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{text}</p>
    </div>
  );
}
