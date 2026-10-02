"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/admin/api-client";
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES, type ImageFolder } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/validations/common";

import { Dropzone } from "./dropzone";
import { uploadImage, validateImageFile } from "./upload";

type ImageUploadProps = {
  value: Media | null;
  onChange: (value: Media | null) => void;
  folder: ImageFolder;
  shape?: "square" | "circle" | "wide";
  label?: string;
};

/** Single image field with drag-and-drop upload, preview and removal. */
export function ImageUpload({ value, onChange, folder, shape = "square", label = "image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) return void toast.error(problem);
    setUploading(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const frame = cn(
    "relative shrink-0 overflow-hidden border bg-muted",
    shape === "circle" && "size-20 rounded-full",
    shape === "square" && "size-20 rounded-lg",
    shape === "wide" && "aspect-video w-48 rounded-lg"
  );

  return (
    <div className="flex items-center gap-4">
      <div className={frame}>
        {value?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary hosts
          <img src={value.url} alt={value.alt || label} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            None
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2Icon className="size-4 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Dropzone
          compact
          accept={IMAGE_ACCEPT}
          disabled={uploading}
          onFiles={onFiles}
          title={value ? `Replace ${label}` : `Upload ${label}`}
          hint={`Drop or click · JPEG, PNG, WebP, GIF, AVIF · max ${IMAGE_MAX_BYTES / 1024 / 1024} MB`}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start text-muted-foreground"
            onClick={() => onChange(null)}
            disabled={uploading}
          >
            <Trash2Icon className="mr-1.5 size-3.5" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
