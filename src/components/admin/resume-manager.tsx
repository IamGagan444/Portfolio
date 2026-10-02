"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, errorMessage } from "@/lib/admin/api-client";
import { queryKeys } from "@/lib/admin/resources";
import { formatBytes, formatFullDate } from "@/lib/format";
import { RESUME_MAX_BYTES } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import type { ResumeDTO } from "@/lib/validations/portfolio";

import { ConfirmDialog } from "./confirm-dialog";
import { Dropzone } from "./form/dropzone";
import { PageHeader } from "./page-header";
import { EmptyState, ErrorState, ListSkeleton } from "./states";

const ENDPOINT = "/api/admin/resume";

export function ResumeManager() {
  const qc = useQueryClient();
  const resumes = useQuery({ queryKey: queryKeys.resumes, queryFn: () => api<ResumeDTO[]>(ENDPOINT) });
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.resumes });

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [makeActive, setMakeActive] = useState(true);
  const [deleting, setDeleting] = useState<ResumeDTO | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  const upload = useMutation({
    mutationFn: () => {
      const body = new FormData();
      body.append("file", file!);
      body.append("title", title.trim());
      body.append("makeActive", String(makeActive));
      return api<ResumeDTO>(ENDPOINT, { method: "POST", body });
    },
    onSuccess: (resume) => {
      toast.success(`Uploaded version ${resume.version}${resume.isActive ? " — now live" : ""}`);
      setFile(null);
      setTitle("");
      return refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const patch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; isActive?: true } }) =>
      api<ResumeDTO>(`${ENDPOINT}/${id}`, { method: "PATCH", json: data }),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: queryKeys.resumes });
      const previous = qc.getQueryData<ResumeDTO[]>(queryKeys.resumes);
      qc.setQueryData<ResumeDTO[]>(queryKeys.resumes, (list) =>
        list?.map((r) => ({
          ...r,
          ...(r.id === id && data.title ? { title: data.title } : {}),
          ...(data.isActive ? { isActive: r.id === id } : {}),
        })),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.resumes, context.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: (_r, { data }) => toast.success(data.isActive ? "Active resume updated" : "Renamed"),
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`${ENDPOINT}/${id}`, { method: "DELETE" }),
    onSuccess: () => toast.success("Resume version deleted"),
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: refresh,
  });

  const pickFile = (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    if (picked.type !== "application/pdf" && !picked.name.toLowerCase().endsWith(".pdf")) {
      return void toast.error("Only PDF files are allowed");
    }
    if (picked.size > RESUME_MAX_BYTES) {
      return void toast.error(`File is larger than ${RESUME_MAX_BYTES / 1024 / 1024} MB`);
    }
    setFile(picked);
    if (!title) setTitle(picked.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "));
  };

  const active = resumes.data?.find((r) => r.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resume"
        description="Upload new versions and choose which one the public “Download Resume” button serves."
        actions={
          active && (
            <a href="/resume" target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
              <ExternalLinkIcon className="size-3.5" /> Open public link
            </a>
          )
        }
      />

      <section className="rounded-lg border bg-background">
        <header className="border-b px-5 py-3.5">
          <h2 className="text-sm font-semibold">Upload a new version</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            PDF only, up to {RESUME_MAX_BYTES / 1024 / 1024} MB. Previous versions are kept in the history below.
          </p>
        </header>
        <div className="space-y-4 p-5">
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <FileTextIcon className="size-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <Button variant="ghost" size="icon" className="size-8 rounded-md" onClick={() => setFile(null)} aria-label="Remove file" disabled={upload.isPending}>
                <XIcon className="size-4" />
              </Button>
            </div>
          ) : (
            <Dropzone
              accept="application/pdf,.pdf"
              onFiles={pickFile}
              title="Drop your resume PDF here or click to browse"
              hint={`PDF · max ${RESUME_MAX_BYTES / 1024 / 1024} MB`}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <label htmlFor="resume-title" className="text-[13px] font-medium">
                Title
              </label>
              <Input
                id="resume-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resume — Full-stack 2026"
                maxLength={120}
              />
            </div>
            <label className="flex h-9 items-center gap-2 text-[13px]">
              <Switch checked={makeActive} onCheckedChange={setMakeActive} aria-label="Make active after upload" />
              Make active
            </label>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => upload.mutate()} disabled={!file || !title.trim() || upload.isPending} className="min-w-28">
              {upload.isPending ? <Loader2Icon className="size-4 animate-spin" /> : "Upload"}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Version history</h2>
        {resumes.isPending ? (
          <ListSkeleton rows={3} />
        ) : resumes.isError ? (
          <ErrorState message={resumes.error.message} onRetry={() => resumes.refetch()} />
        ) : resumes.data.length === 0 ? (
          <EmptyState icon={FileTextIcon} title="No resume uploaded" description="Upload a PDF above. The first upload becomes active automatically." />
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border bg-background">
            {resumes.data.map((resume) => (
              <li key={resume.id} className={cn("flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center", resume.isActive && "bg-muted/30")}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background font-mono text-xs">
                    v{resume.version}
                  </span>
                  <div className="min-w-0">
                    {renaming?.id === resume.id ? (
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const next = renaming.title.trim();
                          if (next && next !== resume.title) patch.mutate({ id: resume.id, data: { title: next } });
                          setRenaming(null);
                        }}
                      >
                        <Input
                          autoFocus
                          value={renaming.title}
                          maxLength={120}
                          aria-label="Resume title"
                          onChange={(e) => setRenaming({ id: resume.id, title: e.target.value })}
                          onKeyDown={(e) => e.key === "Escape" && setRenaming(null)}
                          className="h-8"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Save
                        </Button>
                      </form>
                    ) : (
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        {resume.title}
                        {resume.isActive && (
                          <Badge className="gap-1 px-1.5 py-0 text-[10px]">
                            <CheckCircle2Icon className="size-3" /> Active
                          </Badge>
                        )}
                      </p>
                    )}
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {resume.fileName} · {formatBytes(resume.fileSize)} · {formatFullDate(resume.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  {!resume.isActive && (
                    <Button size="sm" variant="outline" onClick={() => patch.mutate({ id: resume.id, data: { isActive: true } })} disabled={patch.isPending}>
                      Set active
                    </Button>
                  )}
                  <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8 rounded-md")} aria-label={`View version ${resume.version}`}>
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                  <a href={resume.fileUrl} download={resume.fileName} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8 rounded-md")} aria-label={`Download version ${resume.version}`}>
                    <DownloadIcon className="size-3.5" />
                  </a>
                  <Button variant="ghost" size="icon" className="size-8 rounded-md" onClick={() => setRenaming({ id: resume.id, title: resume.title })} aria-label={`Rename version ${resume.version}`}>
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    disabled={resume.isActive}
                    title={resume.isActive ? "Activate another version before deleting this one" : undefined}
                    onClick={() => setDeleting(resume)}
                    aria-label={`Delete version ${resume.version}`}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this resume version?"
        description={`Version ${deleting?.version} (${deleting?.fileName}) and its stored file will be permanently deleted.`}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
