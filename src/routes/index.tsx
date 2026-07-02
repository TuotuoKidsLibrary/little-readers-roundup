import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { BookCard } from "@/components/BookCard";
import { BookDetailSheet } from "@/components/BookDetailSheet";
import type { AgeRange, Book, BookStatus, ScriptType } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tuotuo Kids Library — 妥妥绘本馆" },
      { name: "description", content: "A neighborhood Chinese children's book exchange." },
      { property: "og:title", content: "Tuotuo Kids Library — 妥妥绘本馆" },
      { property: "og:description", content: "A neighborhood Chinese children's book exchange." },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [
      {
        children: `
          if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
              navigator.serviceWorker.register("/sw.js").catch((err) => console.error("PWA Error:", err));
            });
          }
        `,
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { books } = useStore();
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [script, setScript] = useState<ScriptType | "all">("all");
  const [age, setAge] = useState<AgeRange | "all">("all");
  const [status, setStatus] = useState<BookStatus | "all">("all");
  const [selected, setSelected] = useState<Book | null>(null);

  const filtered = useMemo(
    () =>
      books.filter((b) => {
        if (b.status === "private") return false;
        if (script !== "all" && b.script_type !== script) return false;
        if (age !== "all" && b.age_range !== age) return false;
        if (status !== "all" && b.status !== status) return false;
        if (q.trim()) {
          const t = q.toLowerCase();
          if (!b.title.toLowerCase().includes(t) && !b.author.toLowerCase().includes(t) && !b.isbn.includes(t))
            return false;
        }
        return true;
      }),
    [books, q, script, age, status],
  );

  const filters = (
    <div className="flex flex-col gap-5">
      <FilterGroup
        label={t("script_type")}
        value={script}
        options={[
          { v: "all", l: lang === "en" ? "All" : "全部" },
          { v: "Simplified", l: t("script_simplified") },
          { v: "Traditional", l: t("script_traditional") },
          { v: "Bilingual", l: t("script_bilingual") },
        ]}
        onChange={(v) => setScript(v as ScriptType | "all")}
      />
      <FilterGroup
        label={t("age_range")}
        value={age}
        options={[
          { v: "all", l: lang === "en" ? "All ages" : "全部年龄" },
          { v: "0-2", l: lang === "en" ? "0–2" : "0-2 岁" },
          { v: "3-5", l: lang === "en" ? "3–5" : "3-5 岁" },
          { v: "6+", l: lang === "en" ? "6+" : "6 岁以上" },
        ]}
        onChange={(v) => setAge(v as AgeRange | "all")}
      />
      <FilterGroup
        label={lang === "en" ? "Book Status" : "图书状态"}
        value={status}
        options={[
          { v: "all", l: lang === "en" ? "All" : "全部" },
          { v: "available", l: lang === "en" ? "Available" : "可借阅" },
          { v: "for_sale", l: lang === "en" ? "For Sale" : "可出售" },
        ]}
        onChange={(v) => setStatus(v as BookStatus | "all")}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <section className="mb-6 flex flex-col items-start gap-1.5 text-left">
        <Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 text-primary">
          {t("nav_library")}
        </Badge>
        
        <h1 className="font-sans text-[4.3vw] sm:text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-left whitespace-nowrap w-full">
          {lang === "en" ? "Grow Our Library | Raise Bilingual Children" : t("slogan")}
        </h1>
        
        <p className="text-sm text-muted-foreground max-w-xl text-left">
          {t("home_subtitle")}
        </p>
      </section>

      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_placeholder")}
            className="pl-9 rounded-full bg-card"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden rounded-full">
              <SlidersHorizontal className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-card">
            <SheetHeader>
              <SheetTitle className="font-sans font-bold">{lang === "en" ? "Filter books" : "筛选图书"}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6 mt-4">{filters}</div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-sans font-bold text-base mb-4">{lang === "en" ? "Filters" : "筛选过滤"}</h2>
            {filters}
          </div>
        </aside>

        <div>
          <p className="text-xs text-muted-foreground mb-3">
            {lang === "en" ? "Showing " : "正在显示 "}
            <span className="font-medium text-foreground">{filtered.length}</span>
            {lang === "en" ? ` of ${books.length} books` : ` 册图书（总共 ${books.length} 册）`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((b) => (
              <BookCard key={b.id} book={b} onClick={() => setSelected(b)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {lang === "en" ? "No books match these filters yet." : "暂无符合筛选条件的绘本。"}
            </div>
          )}
        </div>
      </div>

      <BookDetailSheet
        book={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              value === o.v
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
