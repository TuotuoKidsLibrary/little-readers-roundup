import { useState } from "react";
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
import { PlusCircle, BookOpen, Tag, Heart, ScanLine, Lock, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { AgeRange, BookStatus, ScriptType } from "@/lib/types";

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
  const [script, setScript] = useState<ScriptType>("Simplified");
  const [age, setAge] = useState<AgeRange>("3-5");
  const [price, setPrice] = useState("");

  const reset = () => {
    setStatus("available");
    setTitle("");
    setAuthor("");
    setIsbn("");
    setScript("Simplified");
    setAge("3-5");
    setPrice("");
  };

  const submit = () => {
    if (!isbn.trim() && !title.trim()) {
      toast.error("Please scan or enter an ISBN (or add a title).");
      return;
    }
    addBook({
      title: title.trim() || `Book ${isbn.trim().slice(-4) || "Untitled"}`,
      author: author.trim() || "Unknown",
      isbn: isbn.trim() || "—",
      script_type: script,
      age_range: age,
      status,
      price: status === "for_sale" ? Number(price) || 0 : undefined,
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

  const simulateScan = () => {
    const fake = "978" + Math.floor(1000000000 + Math.random() * 8999999999).toString();
    setIsbn(fake);
    toast.success("ISBN captured from barcode!");
  };

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
            <Button
              type="button"
              onClick={simulateScan}
              variant="outline"
              className="w-full justify-center gap-2 rounded-lg border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
            >
              <ScanLine className="size-4" /> Scan ISBN Barcode
            </Button>
            <div className="grid gap-1.5">
              <Label htmlFor="isbn" className="text-xs text-muted-foreground">Or enter 13-digit ISBN manually</Label>
              <Input
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978XXXXXXXXXX"
                inputMode="numeric"
                maxLength={13}
              />
            </div>
          </div>

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

          {/* Optional details */}
          <details className="rounded-lg border border-border/60 bg-background/40 p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Optional details
            </summary>
            <div className="flex flex-col gap-3 pt-3">
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
          </details>

          <Button className="w-full rounded-full" onClick={submit}>
            {status === "private" ? "Save to my shelf" : "Contribute book"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}