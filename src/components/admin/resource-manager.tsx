"use client";

import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { ResourceName } from "@/lib/admin/resources";

import { ConfirmDialog } from "./confirm-dialog";
import { useResourceList, useResourceMutations } from "./hooks/use-resource";
import { confirmDiscard } from "./hooks/use-unsaved-changes";
import { PageHeader } from "./page-header";
import { Pagination, SortableList } from "./sortable-list";
import { EmptyState, ErrorState, ListSkeleton } from "./states";

export type FilterDef<T> = {
  key: string;
  label: string;
  options: readonly string[];
  matches: (item: T, value: string) => boolean;
};

export type ResourceFormProps<T> = {
  item: T | null;
  /** Persists the form values (create or update) and closes the dialog on success. */
  submit: (data: unknown) => Promise<void>;
  onCancel: () => void;
};

type ResourceManagerProps<T extends { id: string }> = {
  resource: ResourceName;
  title: string;
  description: string;
  singular: string;
  searchPlaceholder: string;
  matches: (item: T, query: string) => boolean;
  filters?: FilterDef<T>[];
  renderRow: (item: T) => React.ReactNode;
  itemLabel: (item: T) => string;
  Form: React.ComponentType<ResourceFormProps<T>>;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  dialogClassName?: string;
};

const PAGE_SIZE = 15;

export function ResourceManager<T extends { id: string }>({
  resource,
  title,
  description,
  singular,
  searchPlaceholder,
  matches,
  filters = [],
  renderRow,
  itemLabel,
  Form,
  emptyIcon,
  dialogClassName,
}: ResourceManagerProps<T>) {
  const list = useResourceList<T>(resource);
  const { create, update, remove, reorder } = useResourceMutations<T>(resource);

  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const items = useMemo(() => list.data ?? [], [list.data]);
  const q = query.trim().toLowerCase();
  const activeFilters = filters.filter((f) => filterValues[f.key]);
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!q || matches(item, q)) && activeFilters.every((f) => f.matches(item, filterValues[f.key]!)),
      ),
    [items, q, matches, activeFilters, filterValues],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const isFiltering = Boolean(q) || activeFilters.length > 0;

  const closeEditor = (force = false) => {
    if (force || confirmDiscard()) setEditing(null);
  };

  const submit = async (data: unknown) => {
    if (editing === "new") {
      await create.mutateAsync(data);
      toast.success(`${singular} created`);
    } else if (editing) {
      await update.mutateAsync({ id: editing.id, data: data as Record<string, unknown> });
      toast.success(`${singular} updated`);
    }
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={() => setEditing("new")} size="sm" className="gap-1.5">
            <PlusIcon className="size-4" /> Add {singular.toLowerCase()}
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8"
          />
        </div>
        {filters.map((filter) => (
          <div key={filter.key} className="sm:w-44">
            <NativeSelect
              aria-label={filter.label}
              value={filterValues[filter.key] ?? ""}
              onChange={(e) => {
                setFilterValues((prev) => ({ ...prev, [filter.key]: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All {filter.label.toLowerCase()}</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelect>
          </div>
        ))}
      </div>

      {list.isPending ? (
        <ListSkeleton />
      ) : list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={`No ${title.toLowerCase()} yet`}
          description={`Add your first ${singular.toLowerCase()} — it will appear on your portfolio right away.`}
          action={
            <Button size="sm" onClick={() => setEditing("new")} className="gap-1.5">
              <PlusIcon className="size-4" /> Add {singular.toLowerCase()}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try a different search or clear the filters." />
      ) : (
        <div>
          <SortableList
            items={items}
            visible={visible}
            getId={(item) => item.id}
            disabled={isFiltering || reorder.isPending}
            onReorder={(next) => reorder.mutate(next)}
            header={
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>
                  {filtered.length} {filtered.length === 1 ? singular.toLowerCase() : title.toLowerCase()}
                </span>
                <span className="hidden sm:inline">
                  {isFiltering ? "Clear filters to reorder" : "Drag to reorder"}
                </span>
              </div>
            }
            renderRow={(item) => (
              <>
                <div className="min-w-0 flex-1">{renderRow(item)}</div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-md"
                    onClick={() => setEditing(item)}
                    aria-label={`Edit ${itemLabel(item)}`}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleting(item)}
                    aria-label={`Delete ${itemLabel(item)}`}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </>
            )}
          />
          <Pagination page={currentPage} pages={pages} onPage={setPage} />
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className={dialogClassName ?? "max-w-2xl"}>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? `Add ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`}</DialogTitle>
            <DialogDescription>Changes are published to your portfolio as soon as you save.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <Form
              key={editing === "new" ? "new" : editing.id}
              item={editing === "new" ? null : editing}
              submit={submit}
              onCancel={() => closeEditor()}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${singular.toLowerCase()}?`}
        description={
          <>
            <strong className="text-foreground">{deleting ? itemLabel(deleting) : ""}</strong> will be permanently
            removed from your portfolio. This can&apos;t be undone.
          </>
        }
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
