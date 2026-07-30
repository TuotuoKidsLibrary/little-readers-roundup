import type { AgeRange, Book, BookStatus, ScriptType } from "@/lib/types";
import { parseAgeRanges } from "@/lib/bookDisplay";

export interface BookFilterState {
  q: string;
  script: ScriptType | "all";
  age: AgeRange | "all";
  status: BookStatus | "all";
}

export const emptyBookFilters: BookFilterState = {
  q: "",
  script: "all",
  age: "all",
  status: "all",
};

export function applyBookFilters(books: Book[], f: BookFilterState): Book[] {
  return books.filter((b) => {
    if (f.script !== "all" && b.script_type !== f.script) return false;
    if (f.age !== "all" && !parseAgeRanges(b.age_range).includes(f.age)) return false;
    if (f.status !== "all" && b.status !== f.status) return false;
    if (f.q.trim()) {
      const q = f.q.toLowerCase();
      const matches =
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.title_en?.toLowerCase().includes(q) ?? false) ||
        (b.author_en?.toLowerCase().includes(q) ?? false) ||
        b.isbn.includes(q);
      if (!matches) return false;
    }
    return true;
  });
}

export function FilterGroup<T extends string>({
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
            type="button"
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