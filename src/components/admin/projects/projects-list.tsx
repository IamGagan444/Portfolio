"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CopyIcon,
  ExternalLinkIcon,
  FolderKanbanIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { api, errorMessage } from "@/lib/admin/api-client";
import { RESOURCE_ENDPOINTS } from "@/lib/admin/resources";
import { formatPeriod } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProjectDTO } from "@/lib/validations/portfolio";

import { ConfirmDialog } from "../confirm-dialog";
import { useResourceList, useResourceMutations } from "../hooks/use-resource";
import { PageHeader } from "../page-header";
import { Pagination, SortableList } from "../sortable-list";
import { EmptyState, ErrorState, ListSkeleton } from "../states";

const PAGE_SIZE = 12;

export function ProjectsList() {
  const qc = useQueryClient();
  const list = useResourceList<ProjectDTO>("projects");
  const { update, remove, reorder } = useResourceMutations<ProjectDTO>("projects");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<ProjectDTO | null>(null);

  const duplicate = useMutation({
    mutationFn: (id: string) =>
      api<ProjectDTO>(`${RESOURCE_ENDPOINTS.projects}/${id}/duplicate`, { method: "POST" }),
    onSuccess: (copy) => {
      toast.success(`Created “${copy.title}” as a draft`);
      return qc.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const toggle = (project: ProjectDTO, data: Partial<ProjectDTO>, message: string) =>
    update.mutate(
      { id: project.id, data },
      { onSuccess: () => toast.success(message), onError: (error) => toast.error(errorMessage(error)) },
    );

  const items = useMemo(() => list.data ?? [], [list.data]);
  const categories = useMemo(
    () => [...new Set(items.map((p) => p.category).filter(Boolean))].sort(),
    [items],
  );
  const q = query.trim().toLowerCase();
  const filtered = items.filter(
    (p) =>
      (!q ||
        p.title.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q))) &&
      (!status || p.status === status) &&
      (!featured || String(p.featured) === featured) &&
      (!category || p.category === category),
  );
  const isFiltering = Boolean(q || status || featured || category);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const stats = {
    published: items.filter((p) => p.status === "published").length,
    featured: items.filter((p) => p.featured).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={
          items.length
            ? `${items.length} total · ${stats.published} published · ${stats.featured} featured on the homepage`
            : "Showcase your work. Featured projects appear on the homepage."
        }
        actions={
          <Link href="/admin/projects/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
            <PlusIcon className="size-4" /> New project
          </Link>
        }
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search title, description, technology…"
            aria-label="Search projects"
            className="pl-8"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 lg:w-[30rem]">
          <NativeSelect aria-label="Status" value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </NativeSelect>
          <NativeSelect aria-label="Featured" value={featured} onChange={(e) => (setFeatured(e.target.value), setPage(1))}>
            <option value="">Featured: any</option>
            <option value="true">Featured</option>
            <option value="false">Not featured</option>
          </NativeSelect>
          <NativeSelect aria-label="Category" value={category} onChange={(e) => (setCategory(e.target.value), setPage(1))}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {list.isPending ? (
        <ListSkeleton rows={6} />
      ) : list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FolderKanbanIcon}
          title="No projects yet"
          description="Create your first project to start building your portfolio."
          action={
            <Link href="/admin/projects/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
              <PlusIcon className="size-4" /> New project
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching projects" description="Try a different search or clear the filters." />
      ) : (
        <div>
          <SortableList
            items={items}
            visible={visible}
            getId={(p) => p.id}
            disabled={isFiltering || reorder.isPending}
            onReorder={(next) => reorder.mutate(next)}
            header={
              <div className="hidden items-center gap-3 border-b bg-muted/40 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:flex">
                <span className="flex-1">{isFiltering ? `${filtered.length} matching` : "Project · drag to reorder"}</span>
                <span className="w-20 text-center">Featured</span>
                <span className="w-24 text-center">Published</span>
                <span className="w-[7.5rem]" />
              </div>
            }
            renderRow={(p) => (
              <>
                <Link href={`/admin/projects/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {p.thumbnail?.url && (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                      <img src={p.thumbnail.url} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      {p.title}
                      {p.status === "draft" && (
                        <Badge variant="outline" className="px-1.5 py-0 font-mono text-[10px] uppercase">
                          Draft
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[p.category, formatPeriod(p.startDate, p.endDate), p.technologies.slice(0, 3).join(", ")]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </Link>
                <div className="flex w-20 justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      toggle(p, { featured: !p.featured }, p.featured ? "Removed from featured" : "Marked as featured")
                    }
                    aria-pressed={p.featured}
                    aria-label={p.featured ? `Unfeature ${p.title}` : `Feature ${p.title}`}
                    className="rounded-md p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <StarIcon className={cn("size-4", p.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                  </button>
                </div>
                <div className="flex w-24 justify-center">
                  <Switch
                    checked={p.status === "published"}
                    aria-label={p.status === "published" ? `Unpublish ${p.title}` : `Publish ${p.title}`}
                    onCheckedChange={(on) =>
                      toggle(p, { status: on ? "published" : "draft" }, on ? "Published" : "Moved to drafts")
                    }
                  />
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8 rounded-md")}
                    aria-label={`Edit ${p.title}`}
                  >
                    <PencilIcon className="size-3.5" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-md"
                    disabled={duplicate.isPending}
                    onClick={() => duplicate.mutate(p.id)}
                    aria-label={`Duplicate ${p.title}`}
                  >
                    <CopyIcon className="size-3.5" />
                  </Button>
                  {p.status === "published" ? (
                    <a
                      href={`/projects/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "hidden size-8 rounded-md sm:inline-flex")}
                      aria-label={`View ${p.title} on site`}
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  ) : (
                    <span className="hidden size-8 sm:inline-block" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleting(p)}
                    aria-label={`Delete ${p.title}`}
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

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete project?"
        description={
          <>
            <strong className="text-foreground">{deleting?.title}</strong> and its uploaded images will be permanently
            deleted. This can&apos;t be undone.
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
