"use client";

import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type SortableListProps<T> = {
  /** Full ordered list (used to compute new positions). */
  items: T[];
  /** The slice currently on screen (a page, or the filtered results). */
  visible: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
  /** Reordering is disabled while searching/filtering. */
  disabled?: boolean;
  renderRow: (item: T) => React.ReactNode;
  header?: React.ReactNode;
};

/** Rows reorderable by drag-and-drop or the keyboard-accessible up/down buttons. */
export function SortableList<T>({
  items,
  visible,
  getId,
  onReorder,
  disabled,
  renderRow,
  header,
}: SortableListProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const indexOf = (id: string) => items.findIndex((item) => getId(item) === id);

  const move = (fromId: string, toIndex: number) => {
    const from = indexOf(fromId);
    if (from < 0 || toIndex < 0 || toIndex >= items.length || from === toIndex) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(toIndex, 0, moved!);
    onReorder(next);
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      {header}
      <ul className="divide-y">
        {visible.map((item) => {
          const id = getId(item);
          const index = indexOf(id);
          return (
            <li
              key={id}
              draggable={!disabled}
              onDragStart={(e) => {
                setDragId(id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setOverId(id);
              }}
              onDragLeave={() => setOverId((current) => (current === id ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) move(dragId, index);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40",
                dragId === id && "opacity-40",
                overId === id && dragId !== id && "bg-muted shadow-[inset_0_2px_0_0_hsl(var(--foreground))]"
              )}
            >
              {!disabled && (
                <div className="flex shrink-0 items-center text-muted-foreground">
                  <GripVerticalIcon className="size-4 cursor-grab" aria-hidden />
                  <div className="ml-0.5 flex flex-col opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => move(id, index - 1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="rounded p-0.5 hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUpIcon className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(id, index + 1)}
                      disabled={index === items.length - 1}
                      aria-label="Move down"
                      className="rounded p-0.5 hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDownIcon className="size-3" />
                    </button>
                  </div>
                </div>
              )}
              {renderRow(item)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between pt-3 text-sm">
      <span className="font-mono text-xs text-muted-foreground">
        Page {page} of {pages}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          className="h-8 rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-40"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="h-8 rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-40"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
