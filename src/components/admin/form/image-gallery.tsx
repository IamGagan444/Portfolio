"use client";

import { GripVerticalIcon, Loader2Icon, StarIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/lib/admin/api-client";
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES, type ImageFolder } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/validations/common";

import { Dropzone } from "./dropzone";
import { uploadImage, validateImageFile } from "./upload";

type ImageGalleryProps = {
  images: Media[];
  /** Omit to hide thumbnail selection. */
  thumbnail?: Media | null;
  onChange: (next: { images: Media[]; thumbnail: Media | null }) => void;
  max?: number;
  folder?: ImageFolder;
  aspect?: "video" | "portrait";
  label?: string;
};

/**
 * Multi-image manager: parallel uploads, drag-to-reorder, alt text, and
 * thumbnail selection. The first image becomes the thumbnail by default.
 */
export function ImageGallery({
  images,
  thumbnail,
  onChange,
  max = 20,
  folder = "projects",
  aspect = "video",
  label = "Project images",
}: ImageGalleryProps) {
  const withThumbnail = thumbnail !== undefined;
  const [pending, setPending] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Uploads resolve later; read the latest value then so concurrent edits aren't lost.
  const latest = useRef({ images, thumbnail });
  useEffect(() => {
    latest.current = { images, thumbnail };
  }, [images, thumbnail]);

  const emit = (nextImages: Media[], nextThumb: Media | null = thumbnail ?? null) => {
    const thumbStillThere = nextThumb && nextImages.some((img) => img.url === nextThumb.url);
    onChange({ images: nextImages, thumbnail: thumbStillThere ? nextThumb : (nextImages[0] ?? null) });
  };

  const onFiles = async (files: File[]) => {
    const room = max - images.length - pending;
    if (room <= 0) return void toast.error(`At most ${max} images`);
    const accepted: File[] = [];
    for (const file of files.slice(0, room)) {
      const problem = validateImageFile(file);
      if (problem) toast.error(problem);
      else accepted.push(file);
    }
    if (accepted.length === 0) return;

    setPending((n) => n + accepted.length);
    const results = await Promise.allSettled(accepted.map((file) => uploadImage(file, folder)));
    setPending((n) => n - accepted.length);

    const uploaded: Media[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") uploaded.push(result.value);
      else toast.error(errorMessage(result.reason));
    }
    if (uploaded.length > 0) {
      emit([...latest.current.images, ...uploaded], latest.current.thumbnail ?? null);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    }
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    emit(next);
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label={label}>
          {images.map((img, index) => {
            const isThumb = withThumbnail && thumbnail?.url === img.url;
            return (
              <li
                key={img.url}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) move(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={cn(
                  "group overflow-hidden rounded-lg border bg-background",
                  isThumb && "ring-2 ring-foreground ring-offset-1",
                  dragIndex === index && "opacity-50"
                )}
              >
                <div className={cn("relative bg-muted", aspect === "video" ? "aspect-video" : "aspect-[4/5]")}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                  <img src={img.url} alt={img.alt || `Image ${index + 1}`} className="size-full object-cover" />
                  <span className="absolute left-1.5 top-1.5 cursor-grab rounded bg-background/90 p-0.5 text-muted-foreground">
                    <GripVerticalIcon className="size-3.5" />
                  </span>
                  {isThumb && (
                    <span className="absolute right-1.5 top-1.5 rounded bg-foreground px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-background">
                      Thumbnail
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 p-2">
                  <input
                    value={img.alt ?? ""}
                    onChange={(e) =>
                      emit(images.map((m, i) => (i === index ? { ...m, alt: e.target.value.slice(0, 200) } : m)))
                    }
                    placeholder="Alt text"
                    aria-label={`Alt text for image ${index + 1}`}
                    className="h-7 w-full rounded border bg-background px-2 text-xs outline-none focus-visible:border-foreground/40"
                  />
                  <div className="flex items-center justify-between">
                    {withThumbnail ? (
                    <button
                      type="button"
                      onClick={() => emit(images, img)}
                      disabled={isThumb}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                      <StarIcon className={cn("size-3.5", isThumb && "fill-current")} />
                      {isThumb ? "Thumbnail" : "Set thumbnail"}
                    </button>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground">#{index + 1}</span>
                    )}
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
                        aria-label="Move left"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, index + 1)}
                        disabled={index === images.length - 1}
                        className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
                        aria-label="Move right"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => emit(images.filter((_, i) => i !== index))}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          {Array.from({ length: pending }).map((_, i) => (
            <li key={`pending-${i}`} className="flex aspect-video items-center justify-center rounded-lg border bg-muted">
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            </li>
          ))}
        </ul>
      )}
      <Dropzone
        accept={IMAGE_ACCEPT}
        multiple
        disabled={images.length + pending >= max}
        onFiles={onFiles}
        title="Drop images here or click to upload"
        hint={`Up to ${max} images · JPEG, PNG, WebP, GIF, AVIF · max ${IMAGE_MAX_BYTES / 1024 / 1024} MB each`}
      />
    </div>
  );
}
