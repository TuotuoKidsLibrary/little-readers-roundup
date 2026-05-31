import { useRef, useState } from "react";
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
import type { AgeRange, BookStatus, ScriptType } from "@/lib/types";
import { IsbnScanner } from "./IsbnScanner";

const contributionOptions: {
  id: BookStatus;
  title: string;
  sub: string;
  Icon: typeof BookOpen;
}[] = [
  { id: "available", title: "Lend It", sub: "Share with another family — they return when done.", Icon: BookOpen },
  { id: "for_sale", title: "Sell It", sub: "Set an asking price; buyer pays you directly.", Icon: Tag },
  { id: "donation", title: "Donate It", sub: "Goes into the central Library collection.", Icon: Heart },
  { id: "private", title: "Private (Personal Shelf Only)", sub: "Only visible to you on your My Contributions tab.", Icon: Lock },
];

export function LogBookDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { addBook } = useStore();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<BookStatus>("available");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [script, setScript] = useState<ScriptType>("Simplified");
  const [age, setAge] = useState<AgeRange>("3-5");
  const [price, setPrice] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const isbnRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("available");
    setTitle("");
    setAuthor("");
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
    try {
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleaned}&jscmd=data&format=json`,
      );
      const json = (await res.json()) as Record<string, { title?: string; authors?: { name: string }[] }>;
      const entry = json[`ISBN:${cleaned}`];
      if (!entry || !entry.title) {
        setLookupState("not_found");
        return;
      }
      setTitle(entry.title);
      setAuthor(entry.authors?.[0]?.name ?? "");
      setCoverUrl(`https://covers.openlibrary.org/b/isbn/${cleaned}-L.jpg`);
      setLookupState("found");
    } catch {
      setLookupState("not_found");
    }
  };

  const saveBook = () => {
    if (!title.trim()) {
      toast.error("Please enter the book title.");
      return;
    }
    addBook({
      title: title.trim(),
      author: author.trim() || "Unknown",
      isbn: isbn.trim() || "—",
      script_type: script,
      age_range: age,
      status,
      price: status === "for_sale" ? Number(price) || 0 : undefined,
      cover_url: coverUrl,
    });
    toast.success(
      status === "donation"
        ? "Donation logged — please coordinate delivery to the Admin Hub."
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

  const showDetails = lookupState === "found" || lookupState === "not_found";
  const loading = lookupState === "loading";

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
            <PlusCircle className="size-4" /> Contribute
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Contribute a book</DialogTitle>
          <DialogDescription>Start by scanning or entering the ISBN, then pick how to share it.</DialogDescription>
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
                <ScanLine className="size-4" /> Scan ISBN Barcode
              </Button>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="isbn" className="text-xs text-muted-foreground">Or enter 13-digit ISBN manually</Label>
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
                    Searching public library databases...
                  </>
                ) : (
                  "Look up book"
                )}
              </Button>
            )}
            {lookupState === "not_found" && (
              <p className="text-xs text-foreground/80 rounded-lg bg-accent/40 border border-accent p-2.5">
                ISBN not found in public registries. No worries! Please type the Title and Author details below to add it manually to our community library.
              </p>
            )}
            {lookupState === "found" && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex gap-3 items-start">
                {coverUrl && (
                  <img src={coverUrl} alt={title} className="h-16 w-12 object-cover rounded-sm shadow" />
                )}
                <div className="flex flex-col text-xs">
                  <span className="font-serif font-bold text-sm">{title}</span>
                  <span className="text-muted-foreground">{author || "Unknown author"}</span>
                  <span className="text-[10px] text-primary mt-1">Pulled from Open Library — confirm details below.</span>
                </div>
              </div>
            )}
          </div>

          {showDetails && (
          <>
          {/* Contribution choice */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How would you like to share it?
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {contributionOptions.map(({ id, title: t, sub, Icon }) => {
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
                    <span className="flex flex-col">
                      <span className="font-serif font-bold text-sm">{t}</span>
                      <span className="text-xs text-muted-foreground">{sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {status === "for_sale" && (
            <div className="grid gap-1.5">
              <Label htmlFor="price">Asking price ($)</Label>
              <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="8" />
            </div>
          )}

          {status === "donation" && (
            <p className="text-xs text-muted-foreground rounded-lg bg-accent/40 border border-accent p-2.5">
              Donated books go to the central Library — please coordinate drop-off at the Admin Hub.
            </p>
          )}

          {status === "private" && (
            <p className="text-xs text-foreground/80 rounded-lg bg-muted/60 border border-border p-2.5 flex gap-2 items-start">
              <Lightbulb className="size-4 text-primary shrink-0 mt-0.5" />
              <span>Keep track of your personal collection privately—you can easily toggle this to public when your kids outgrow it!</span>
            </p>
          )}

          {/* Book details — confirm before saving */}
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Confirm book details
            </p>
            <div className="flex flex-col gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="title">Title (中文)</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：好饿的毛毛虫" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="author">Author</Label>
                <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Script</Label>
                  <RadioGroup value={script} onValueChange={(v) => setScript(v as ScriptType)} className="flex gap-2">
                    {(["Simplified", "Traditional"] as ScriptType[]).map((s) => (
                      <Label key={s} className={`flex-1 cursor-pointer rounded-md border p-2 text-center text-sm ${script === s ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value={s} className="sr-only" />
                        {s === "Simplified" ? "简体" : "繁體"}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="grid gap-1.5">
                  <Label>Age</Label>
                  <RadioGroup value={age} onValueChange={(v) => setAge(v as AgeRange)} className="flex gap-1">
                    {(["0-2", "3-5", "6+"] as AgeRange[]).map((a) => (
                      <Label key={a} className={`flex-1 cursor-pointer rounded-md border p-2 text-center text-xs ${age === a ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value={a} className="sr-only" />
                        {a}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full rounded-full gap-2" onClick={saveBook}>
            {status === "private" ? "Save to my shelf" : "Contribute book"}
          </Button>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}