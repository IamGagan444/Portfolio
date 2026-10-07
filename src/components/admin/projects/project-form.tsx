"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { EyeIcon, Loader2Icon, PencilLineIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Markdown from "react-markdown";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/admin/api-client";
import { queryKeys, RESOURCE_ENDPOINTS, toInputDate } from "@/lib/admin/resources";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { type ProjectDTO, type ProjectInput, projectSchema } from "@/lib/validations/portfolio";

import { Field, FormSection } from "../form/field";
import { ImageGallery } from "../form/image-gallery";
import { handleFormError } from "../form/server-errors";
import { TagInput } from "../form/tag-input";
import { VideoUpload } from "../form/video-upload";
import { confirmDiscard, useUnsavedChanges } from "../hooks/use-unsaved-changes";

function defaults(project: ProjectDTO | null): ProjectInput {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    shortDescription: project?.shortDescription ?? "",
    description: project?.description ?? "",
    thumbnail: project?.thumbnail ?? null,
    images: project?.images ?? [],
    video: project?.video ?? "",
    technologies: project?.technologies ?? [],
    category: project?.category ?? "",
    liveUrl: project?.liveUrl ?? "",
    githubUrl: project?.githubUrl ?? "",
    featured: project?.featured ?? false,
    status: project?.status ?? "draft",
    startDate: toInputDate(project?.startDate, "month"),
    endDate: toInputDate(project?.endDate, "month"),
  };
}

type ProjectFormProps = {
  project: ProjectDTO | null;
  categories?: string[];
  technologySuggestions?: string[];
};

export function ProjectForm({ project, categories = [], technologySuggestions = [] }: ProjectFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const formId = useId();
  const [preview, setPreview] = useState(false);

  const { register, control, handleSubmit, watch, setError, reset, setValue, getValues, formState } =
    useForm<ProjectInput>({
      resolver: zodResolver(projectSchema),
      defaultValues: defaults(project),
      mode: "onTouched",
    });
  const { errors, isDirty, isSubmitting } = formState;
  useUnsavedChanges(formId, isDirty && !isSubmitting);

  const title = watch("title");
  const description = watch("description");

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (project) {
        const saved = await api<ProjectDTO>(`${RESOURCE_ENDPOINTS.projects}/${project.id}`, {
          method: "PATCH",
          json: values,
        });
        qc.setQueryData(queryKeys.item("projects", saved.id), saved);
        await qc.invalidateQueries({ queryKey: queryKeys.list("projects") });
        reset(defaults(saved));
        toast.success("Project saved");
      } else {
        const created = await api<ProjectDTO>(RESOURCE_ENDPOINTS.projects, { method: "POST", json: values });
        await qc.invalidateQueries({ queryKey: queryKeys.list("projects") });
        reset(defaults(created));
        toast.success("Project created");
        router.replace(`/admin/projects/${created.id}`);
      }
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 pb-24">
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <FormSection title="Basics">
            <Field label="Title" htmlFor="title" required error={errors.title?.message}>
              <Input id="title" autoFocus={!project} aria-invalid={!!errors.title} {...register("title")} />
            </Field>
            <Field
              label="URL slug"
              htmlFor="slug"
              error={errors.slug?.message}
              hint={
                <>
                  /projects/<span className="font-mono">{watch("slug") || slugify(title) || "…"}</span>
                  {!watch("slug") && " — generated from the title"}
                </>
              }
            >
              <div className="flex gap-2">
                <Input id="slug" placeholder={slugify(title)} className="font-mono" {...register("slug")} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setValue("slug", slugify(getValues("title")), { shouldDirty: true })}
                >
                  Generate
                </Button>
              </div>
            </Field>
            <Field
              label="Short description"
              htmlFor="shortDescription"
              required
              error={errors.shortDescription?.message}
              hint="Shown on project cards. Markdown supported."
            >
              <Textarea
                id="shortDescription"
                rows={3}
                aria-invalid={!!errors.shortDescription}
                {...register("shortDescription")}
              />
            </Field>
          </FormSection>

          <FormSection title="Media" description="The thumbnail is used on cards and for social previews.">
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageGallery
                  images={field.value}
                  thumbnail={watch("thumbnail")}
                  onChange={({ images, thumbnail }) => {
                    field.onChange(images);
                    setValue("thumbnail", thumbnail, { shouldDirty: true });
                  }}
                />
              )}
            />
            {errors.images?.message && <p className="text-xs text-destructive">{errors.images.message}</p>}
            <Field
              label="Preview video"
              htmlFor="video"
              error={errors.video?.message}
              hint="Optional autoplaying loop, shown instead of the thumbnail on cards and the project page."
            >
              <Controller
                control={control}
                name="video"
                render={({ field }) => (
                  <VideoUpload id="video" value={field.value} onChange={field.onChange} invalid={!!errors.video} />
                )}
              />
            </Field>
          </FormSection>

          <FormSection title="Details">
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="text-[13px] font-medium">
                Full description
              </label>
              <div className="flex rounded-md border p-0.5 text-xs" role="tablist" aria-label="Description mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!preview}
                  onClick={() => setPreview(false)}
                  className={cn("flex items-center gap-1 rounded px-2 py-1", !preview && "bg-muted font-medium")}
                >
                  <PencilLineIcon className="size-3" /> Write
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={preview}
                  onClick={() => setPreview(true)}
                  className={cn("flex items-center gap-1 rounded px-2 py-1", preview && "bg-muted font-medium")}
                >
                  <EyeIcon className="size-3" /> Preview
                </button>
              </div>
            </div>
            {preview ? (
              <div className="prose prose-sm min-h-[12rem] max-w-none rounded-md border bg-muted/20 p-4 dark:prose-invert">
                {description ? <Markdown>{description}</Markdown> : <p className="text-muted-foreground">Nothing to preview.</p>}
              </div>
            ) : (
              <Textarea
                id="description"
                rows={10}
                placeholder="Problem, approach, results… Markdown supported."
                className="font-mono text-[13px]"
                {...register("description")}
              />
            )}
            {errors.description?.message && <p className="text-xs text-destructive">{errors.description.message}</p>}
            <Field
              label="Technologies"
              htmlFor="technologies"
              error={errors.technologies?.message}
              hint="Press Enter or comma to add."
            >
              <Controller
                control={control}
                name="technologies"
                render={({ field }) => (
                  <TagInput
                    id="technologies"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={technologySuggestions}
                    placeholder="Next.js, TypeScript…"
                  />
                )}
              />
            </Field>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title="Visibility">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium">Published</p>
                <p className="text-xs text-muted-foreground">Visible on the public site</p>
              </div>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Switch
                    aria-label="Published"
                    checked={field.value === "published"}
                    onCheckedChange={(on) => field.onChange(on ? "published" : "draft")}
                  />
                )}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium">Featured</p>
                <p className="text-xs text-muted-foreground">Show on the homepage</p>
              </div>
              <Controller
                control={control}
                name="featured"
                render={({ field }) => (
                  <Switch aria-label="Featured" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <Field label="Category" htmlFor="category" error={errors.category?.message}>
              <Input id="category" list="project-categories" placeholder="Web App" {...register("category")} />
              <datalist id="project-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </FormSection>

          <FormSection title="Links">
            <Field label="Live URL" htmlFor="liveUrl" error={errors.liveUrl?.message}>
              <Input id="liveUrl" type="url" placeholder="https://" {...register("liveUrl")} />
            </Field>
            <Field label="GitHub URL" htmlFor="githubUrl" error={errors.githubUrl?.message}>
              <Input id="githubUrl" type="url" placeholder="https://github.com/…" {...register("githubUrl")} />
            </Field>
          </FormSection>

          <FormSection title="Timeline">
            <Field label="Start" htmlFor="startDate" error={errors.startDate?.message}>
              <Input id="startDate" type="month" {...register("startDate")} />
            </Field>
            <Field label="End" htmlFor="endDate" error={errors.endDate?.message} hint="Leave empty for “Present”.">
              <Input id="endDate" type="month" {...register("endDate")} />
            </Field>
          </FormSection>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
            {isSubmitting ? "Saving…" : isDirty ? "Unsaved changes" : project ? "All changes saved" : "New project"}
          </p>
          <div className="flex gap-2">
            <Link
              href="/admin/projects"
              onClick={(e) => {
                if (!confirmDiscard()) e.preventDefault();
              }}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {isDirty ? "Cancel" : "Back"}
            </Link>
            <Button type="submit" size="sm" disabled={isSubmitting || (!!project && !isDirty)} className="min-w-28">
              {isSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : project ? "Save changes" : "Create project"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
