import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, BookOpen, Tag, Heart, ScanLine, Lock, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { AgeRange, BookStatus, ScriptType } from "@/lib/types";
import { IsbnScanner } from "./IsbnScanner";

export function LogBookDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { addBook, books } = useStore();
  const { t } = useI18n();
  const contributionOptions: {
    id: BookStatus;
    title: string;
    sub: string;
    Icon: typeof BookOpen;
  }[] = [
    { id: "available", title: t("status_lend"), sub: t("lend_sub"), Icon: BookOpen },
    { id: "for_sale", title: t("status_sell"), sub: t("sell_sub"), Icon: Tag },
    { id: "donation", title: t("status_donate"), sub: t("donate_sub"), Icon: Heart },
    { id: "private", title: t("status_private"), sub: t("private_sub"), Icon: Lock },
  ];
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<BookStatus>("available");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [titleZh, setTitleZh] = useState("");
  const [authorZh, setAuthorZh] = useState("");
  const [isbn, setIsbn] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [script, setScript] = useState<ScriptType>("Simplified");
  const [age, setAge] = useState<AgeRange>("3-5");
  const [price, setPrice] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "found" | "not_found" | "cached">("idle");
  const isbnRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("available");
    setTitle("");
    setAuthor("");
    setTitleZh("");
    setAuthorZh("");
    setIsbn("");
    setCoverUrl(undefined);
    setScript("Simplified");
    setAge("3-5");
    setPrice("");
    setScanning(false);
    setLookupState("idle");
  };

  const runLookup = async () => {
    const cleaned = isbn.trim();
    if (!/^\d{13}$/.test(cleaned)) {
      toast.error("Please enter a valid 13-digit ISBN.");
      return;
    }
    setLookupState("loading");

    // 1. Local community cache — has any member nationwide cataloged this ISBN?
    const cached = books.find((b) => b.isbn === cleaned);
    if (cached) {
      setTitle(cached.title);
      setAuthor(cached.author);
      setScript(cached.script_type);
      setAge(cached.age_range);
      if (cached.cover_url) setCoverUrl(cached.cover_url);
      setLookupState("cached");
      return;
    }

    // 2. Open Library with 1.5s timeout
    const fetchWithTimeout = async (url: string, ms: number) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ms);
      try {
        return await fetch(url, { signal: ctrl.signal });
      } finally {
        clearTimeout(timer);
      }
    };

    try {
      const res = await fetchWithTimeout(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleaned}&jscmd=data&format=json`,
        1500,
      );
      const json = (await res.json()) as Record<string, { title?: string; authors?: { name: string }[] }>;
      const entry = json[`ISBN:${cleaned}`];
      if (entry && entry.title) {
        setTitle(entry.title);
        setAuthor(entry.authors?.[0]?.name ?? "");
        setCoverUrl(`https://covers.openlibrary.org/b/isbn/${cleaned}-L.jpg`);
        setLookupState("found");
        return;
      }
    } catch {
      /* fall through to Google Books */
    }

    // 3. Fallback — Google Books (open East-Asian-friendly registry)
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleaned}`,
      );
      const json = (await res.json()) as {
        items?: { volumeInfo?: { title?: string; authors?: string[]; imageLinks?: { thumbnail?: string } } }[];
      };
      const info = json.items?.[0]?.volumeInfo;
      if (info?.title) {
        setTitle(info.title);
        setAuthor(info.authors?.[0] ?? "");
        const img = info.imageLinks?.thumbnail?.replace("http:", "https:");
        if (img) setCoverUrl(img);
        setLookupState("found");
        return;
      }
    } catch {
      /* fall through to not_found */
    }

    setLookupState("not_found");
  };

  const saveBook = () => {
    if (!title.trim()) {
      toast.error("Please enter the book title.");
      return;
    }
    if (script === "Bilingual" && !titleZh.trim()) {
      toast.error("Bilingual books require both English and Chinese titles.");
      return;
    }
    const finalTitle =
      script === "Bilingual" && titleZh.trim()
        ? `${title.trim()} / ${titleZh.trim()}`
        : title.trim();
    const finalAuthor =
      script === "Bilingual" && authorZh.trim()
        ? `${author.trim() || "Unknown"} / ${authorZh.trim()}`
        : author.trim() || "Unknown";
    addBook({
      title: finalTitle,
      author: finalAuthor,
      isbn: isbn.trim() || "—",
      script_type: script,
      age_range: age,
      status,
      price: status === "for_sale" ? Number(price) || 0 : undefined,
      cover_url: coverUrl,
    });
    toast.success(
      status === "donation"
        ? "Donation logged."
        : status === "for_sale"
          ? "Book listed for sale!"
          : status === "private"
            ? "Saved to your private shelf."
            : "Book added to the Library!",
    );
    reset();
    setOpen(false);
  };

  const handleDetected = (code: string) => {
    setIsbn(code);
    setScanning(false);
    toast.success("ISBN captured from barcode!");
  };

  const showDetails =
    lookupState === "found" || lookupState === "not_found" || lookupState === "cached";
  const loading = lookupState === "loading";

  // Auto-focus the Title input when fallback (not_found) is triggered
  useEffect(() => {
    if (lookupState === "not_found") {
      const id = setTimeout(() => titleRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [lookupState]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5 rounded-full">
            <PlusCircle className="size-4" /> {t("contribute")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{t("contribute_title")}</DialogTitle>
          <DialogDescription>{t("contribute_subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* ISBN ingestion */}
          <div className="rounded-xl border border-border bg-background/60 p-3 flex flex-col gap-2.5">
            {scanning ? (
              <IsbnScanner
                onDetected={handleDetected}
                onClose={() => setScanning(false)}
                onManualFallback={() => {
                  setScanning(false);
                  setTimeout(() => isbnRef.current?.focus(), 50);
                }}
              />
            ) : (
              <Button
                type="button"
                onClick={() => setScanning(true)}
                variant="outline"
                className="w-full justify-center gap-2 rounded-lg border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
              >
                <ScanLine className="size-4" /> {t("scan_isbn")}
              </Button>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="isbn" className="text-xs text-muted-foreground">{t("manual_entry")}</Label>
              <Input
                id="isbn"
                ref={isbnRef}
                value={isbn}
                onChange={(e) => {
                  setIsbn(e.target.value);
                  if (lookupState !== "idle") setLookupState("idle");
                }}
                placeholder="978XXXXXXXXXX"
                inputMode="numeric"
                maxLength={13}
              />
            </div>
            {!showDetails && (
              <Button
                type="button"
                onClick={runLookup}
                disabled={loading || !isbn.trim()}
                className="w-full rounded-lg gap-2"
                variant="secondary"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("searching_db")}
                  </>
                ) : (
                  t("lookup_book")
                )}
              </Button>
            )}
            {lookupState === "not_found" && (
              <p className="text-xs text-foreground/80 rounded-lg bg-accent/40 border border-accent p-2.5">
                {t("isbn_not_found")}
              </p>
            )}
            {lookupState === "found" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex gap-3 items-start">
                {coverUrl && (
                  <img src={coverUrl} alt={title} className="h-16 w-12 object-cover rounded-sm shadow" />
                )}
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-serif font-bold text-sm break-words">{title}</span>
                  <span className="text-muted-foreground break-words">{author || "Unknown author"}</span>
                  <span className="text-[10px] text-primary mt-1">{t("pulled_from_ol")}</span>
                </div>
              </div>
            )}
            {lookupState === "cached" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex gap-3 items-start">
                {coverUrl && (
                  <img src={coverUrl} alt={title} className="h-16 w-12 object-cover rounded-sm shadow" />
                )}
                <div className="flex flex-col text-xs min-w-0">
                  <span className="font-serif font-bold text-sm break-words">{title}</span>
                  <span className="text-muted-foreground break-words">{author || "Unknown author"}</span>
                  <span className="text-[10px] text-primary mt-1">{t("pulled_from_cache")}</span>
                </div>
              </div>
            )}
          </div>

          {showDetails && (
          <>
          {/* Contribution choice */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("select_sharing_option")}
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {contributionOptions.map(({ id, title: optTitle, sub, Icon }) => {
                const active = status === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStatus(id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-border bg-background/60 hover:border-primary/40"
                    }`}
                  >
                    <span className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="font-serif font-bold text-sm">{optTitle}</span>
                      <span className="text-xs text-muted-foreground break-words">{sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {status === "for_sale" && (
            <div className="grid gap-1.5">
              <Label htmlFor="price">{t("asking_price")}</Label>
              <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="8" />
            </div>
          )}

          {status === "donation" && (
            <p className="text-xs text-muted-foreground rounded-lg bg-accent/40 border border-accent p-2.5">
              {t("donation_note")}
            </p>
          )}

          {status === "private" && (
            <p className="text-xs text-foreground/80 rounded-lg bg-muted/60 border border-border p-2.5 flex gap-2 items-start">
              <Lightbulb className="size-4 text-primary shrink-0 mt-0.5" />
              <span>{t("private_note")}</span>
            </p>
          )}

          {/* Book details */}
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("confirm_book_details")}
            </p>
            <div className="flex flex-col gap-3">
              <div className="grid gap-1.5">
                <Label>{t("script_type")}</Label>
                <RadioGroup
                  value={script}
                  onValueChange={(v) => setScript(v as ScriptType)}
                  className="grid grid-cols-3 gap-2"
                >
                  {(["Simplified", "Traditional", "Bilingual"] as ScriptType[]).map((s) => {
                    const label =
                      s === "Simplified"
                        ? t("script_label_simplified")
                        : s === "Traditional"
                          ? t("script_label_traditional")
                          : t("script_label_bilingual");
                    return (
                      <Label
                        key={s}
                        className={`cursor-pointer rounded-md border px-2 py-2 text-center text-sm font-medium leading-tight whitespace-nowrap ${
                          script === s ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <RadioGroupItem value={s} className="sr-only" />
                        {label}
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>
              {script === "Bilingual" && (
                <p className="text-xs text-foreground/80 rounded-lg bg-accent/40 border border-accent p-2.5">
                  {t("bilingual_hint")}
                </p>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="title">
                  {script === "Bilingual" ? t("title_en_label") : t("book_title")}
                </Label>
                <Input id="title" ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：好饿的毛毛虫" />
              </div>
              {script === "Bilingual" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="title_zh">{t("title_zh_label")}</Label>
                  <Input id="title_zh" value={titleZh} onChange={(e) => setTitleZh(e.target.value)} placeholder="例如：好饿的毛毛虫" />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="author">
                  {script === "Bilingual" ? t("author_en_label") : t("author")}
                </Label>
                <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
              {script === "Bilingual" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="author_zh">{t("author_zh_label")}</Label>
                  <Input id="author_zh" value={authorZh} onChange={(e) => setAuthorZh(e.target.value)} />
                </div>
              )}
              <div className="grid gap-1.5">
                  <Label>{t("age_range")}</Label>
                  <RadioGroup value={age} onValueChange={(v) => setAge(v as AgeRange)} className="flex gap-1">
                    {(["0-2", "3-5", "6+"] as AgeRange[]).map((a) => (
                      <Label key={a} className={`flex-1 cursor-pointer rounded-md border p-2 text-center text-xs ${age === a ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value={a} className="sr-only" />
                        {a === "0-2" ? t("age_0_2") : a === "3-5" ? t("age_3_5") : t("age_6_plus")}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button className="flex-1 rounded-full gap-2" onClick={saveBook}>
              {status === "private" ? t("save_to_private_shelf") : t("confirm_add_book")}
            </Button>
          </div>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
