"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type TagInputProps = {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  invalid?: boolean;
  max?: number;
};

/** Chip input: Enter or comma adds, Backspace on empty input removes the last chip. */
export function TagInput({ id, value, onChange, placeholder, suggestions = [], invalid, max = 50 }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const listId = id ? `${id}-suggestions` : undefined;

  const add = (raw: string) => {
    const tag = raw.trim().slice(0, 50);
    if (!tag || value.length >= max) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
  };

  const commit = () => {
    draft.split(",").forEach(add);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 shadow-sm",
        "focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/20",
        invalid && "border-destructive"
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`Remove ${tag}`}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        list={listId}
        value={draft}
        placeholder={value.length === 0 ? placeholder : undefined}
        onChange={(e) => {
          const next = e.target.value;
          if (next.endsWith(",")) {
            add(next.slice(0, -1));
            setDraft("");
          } else setDraft(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
      />
      {listId && suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
      )}
    </div>
  );
}
