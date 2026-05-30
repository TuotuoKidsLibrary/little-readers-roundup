import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore, CURRENT_USER_ID } from "@/lib/store";
import { BookCard } from "@/components/BookCard";
import { BookDetailSheet } from "@/components/BookDetailSheet";
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
  const { books, activity } = useStore();
  const mine = useMemo(() => books.filter((b) => b.owner_id === CURRENT_USER_ID), [books]);
  const activeLoans = mine.filter((b) => b.status === "reserved").length;
  const [selected, setSelected] = useState<Book | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6">
      <h1 className="font-serif text-3xl font-bold mb-1">My Shelf & Activity</h1>
      <p className="text-sm text-muted-foreground mb-5">Manage your books, conversations, and exchange history.</p>

      <Tabs defaultValue="contrib" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-muted/60 rounded-full p-1 h-auto">
          <TabsTrigger value="contrib" className="rounded-full gap-1.5 py-2 text-xs sm:text-sm">
            <BookOpen className="size-4" /> Contributions
          </TabsTrigger>
          <TabsTrigger value="msg" className="rounded-full gap-1.5 py-2 text-xs sm:text-sm">
            <MessageSquare className="size-4" /> Messages
          </TabsTrigger>
          <TabsTrigger value="hist" className="rounded-full gap-1.5 py-2 text-xs sm:text-sm">
            <History className="size-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contrib" className="pt-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <StatCard label="Total Contributed" value={mine.length} Icon={BookOpen} />
            <StatCard label="Active Loans" value={activeLoans} Icon={Activity} />
          </div>
          {mine.length === 0 ? (
            <EmptyState text="You haven't contributed any books yet — tap + Log Book to add one." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mine.map((b) => (
                <BookCard key={b.id} book={b} onClick={() => setSelected(b)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="msg" className="pt-5">
          <MessagesPanel />
        </TabsContent>

        <TabsContent value="hist" className="pt-5">
          {activity.length === 0 ? (
            <EmptyState text="No exchanges yet." />
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

function StatCard({ label, value, Icon }: { label: string; value: number; Icon: typeof BookOpen }) {
  return (
    <Card className="p-4 flex items-center gap-3 bg-card">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-serif font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function MessagesPanel() {
  const { threads, messages, sendMessage } = useStore();
  const [activeId, setActiveId] = useState<string | null>(threads[0]?.id ?? null);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const threadMessages = useMemo(
    () => messages.filter((m) => m.thread_id === activeId),
    [messages, activeId],
  );
  const activeThread = threads.find((t) => t.id === activeId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [threadMessages.length]);

  const send = () => {
    if (!activeId || !text.trim()) return;
    sendMessage(activeId, text);
    setText("");
  };

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-3 rounded-2xl border border-border/60 bg-card overflow-hidden min-h-[520px]">
      {/* Thread list */}
      <aside
        className={`border-r border-border ${activeId ? "hidden md:block" : "block"}`}
      >
        {threads.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">No conversations yet.</div>
        ) : (
          <ul>
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setActiveId(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/60 transition-colors ${
                    activeId === t.id ? "bg-primary/5" : "hover:bg-muted/60"
                  }`}
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {t.with_name.split(" ").map((w) => w[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.with_name}</p>
                    <p className="text-xs text-muted-foreground truncate">re: {t.book_title}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Chat */}
      <section className={`flex flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
        {activeThread ? (
          <>
            <header className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setActiveId(null)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Avatar className="size-8">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {activeThread.with_name.split(" ").map((w) => w[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm leading-none">{activeThread.with_name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{activeThread.book_title}</p>
              </div>
            </header>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 max-h-[60vh]">
              {threadMessages.map((m) => {
                const mine = m.from === CURRENT_USER_ID;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p>{m.text}</p>
                      <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {m.at}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <footer className="border-t border-border/60 p-3 flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Send a message…"
                className="rounded-full bg-background"
              />
              <Button onClick={send} size="icon" className="rounded-full shrink-0">
                <Send className="size-4" />
              </Button>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6">
            Pick a conversation to start chatting.
          </div>
        )}
      </section>
    </div>
  );
}