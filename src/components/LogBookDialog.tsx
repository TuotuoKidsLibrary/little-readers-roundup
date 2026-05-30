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
import { PlusCircle, BookOpen, Tag, Heart } from "lucide-react";
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
];

export function LogBookDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { addBook } = useStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choose" | "details">("choose");
  const [status, setStatus] = useState<BookStatus>("available");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [script, setScript] = useState<ScriptType>("Simplified");
  const [age, setAge] = useState<AgeRange>("3-5");
  const [price, setPrice] = useState("");

  const reset = () => {
    setStep("choose");
    setStatus("available");
    setTitle("");
    setAuthor("");
    setIsbn("");
    setScript("Simplified");
    setAge("3-5");
    setPrice("");
  };

  const choose = (s: BookStatus) => {
    setStatus(s);
    setStep("details");
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Please enter a book title.");
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
    });
    toast.success(
      status === "donation"
        ? "Donation logged — please coordinate delivery to the Admin Hub."
        : status === "for_sale"
          ? "Book listed for sale!"
          : "Book added to the Library!",
    );
    reset();
    setOpen(false);
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
            <PlusCircle className="size-4" /> Log Book
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card max-w-md">
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">How would you like to contribute this book?</DialogTitle>
              <DialogDescription>Pick a contribution type — you can change it later.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-1">
              {contributionOptions.map(({ id, title: t, sub, Icon }) => (
                <button
                  key={id}
                  onClick={() => choose(id)}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="size-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-serif font-bold">{t}</span>
                    <span className="text-xs text-muted-foreground">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {status === "available" ? "Lend a Book" : status === "for_sale" ? "List for Sale" : "Donate a Book"}
              </DialogTitle>
              <DialogDescription>
                {status === "donation"
                  ? "Thank you! Donated books go directly into the central Library collection. Please coordinate delivery to the Admin Hub."
                  : "Fill in a few quick details so other parents can find it."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="title">Title (中文)</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：好饿的毛毛虫" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="author">Author</Label>
                  <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input id="isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
                </div>
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
              {status === "for_sale" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="price">Asking price ($)</Label>
                  <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="8" />
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setStep("choose")}>Back</Button>
                <Button className="flex-1" onClick={submit}>Add to Library</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}