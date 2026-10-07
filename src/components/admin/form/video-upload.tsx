"use client";

import { LinkIcon, Trash2Icon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/admin/api-client";
import { formatBytes } from "@/lib/format";
import { VIDEO_ACCEPT, VIDEO_FORMATS, VIDEO_MAX_BYTES } from "@/lib/upload-limits";

import { Dropzone } from "./dropzone";

type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowed_formats: string;
  eager?: string;
  eager_async?: string;
  signature: string;
};

type VideoUploadProps = {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  invalid?: boolean;
};

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/**
 * Video field: drag-and-drop upload (≤ 50 MB) sent directly to Cloudinary with
 * a server-issued signature, live progress, cancel, preview; or paste a URL.
 */
export function VideoUpload({ id, value, onChange, invalid }: VideoUploadProps) {
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [manual, setManual] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const uploading = progress !== null;

  const upload = async (file: File) => {
    if (!(VIDEO_FORMATS as readonly string[]).includes(extensionOf(file.name))) {
      return void toast.error("Use an MP4, WebM or MOV video");
    }
    if (file.size > VIDEO_MAX_BYTES) {
      return void toast.error(`Video is ${formatBytes(file.size)} — the limit is ${formatBytes(VIDEO_MAX_BYTES)}`);
    }

    setProgress({ loaded: 0, total: file.size });
    try {
      const sig = await api<SignedUpload>("/api/admin/uploads/video/sign", { method: "POST" });

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", sig.apiKey);
      body.append("timestamp", String(sig.timestamp));
      body.append("folder", sig.folder);
      body.append("allowed_formats", sig.allowed_formats);
      if (sig.eager) body.append("eager", sig.eager);
      if (sig.eager_async) body.append("eager_async", sig.eager_async);
      body.append("signature", sig.signature);

      // XHR (not fetch) for upload progress events.
      const uploaded = await new Promise<{ public_id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress({ loaded: e.loaded, total: e.total });
        };
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText) as { public_id?: string; error?: { message?: string } };
            if (xhr.status >= 200 && xhr.status < 300 && json.public_id) resolve({ public_id: json.public_id });
            else reject(new Error(json.error?.message ?? `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
        xhr.send(body);
      });

      // The server confirms format and size before the URL is accepted.
      const verified = await api<{ url: string; bytes: number }>("/api/admin/uploads/video/verify", {
        method: "POST",
        json: { publicId: uploaded.public_id },
      });
      onChange(verified.url);
      toast.success(`Video uploaded (${formatBytes(verified.bytes)})`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") toast("Upload cancelled");
      else toast.error(errorMessage(error));
    } finally {
      xhrRef.current = null;
      setProgress(null);
    }
  };

  const percent = progress ? Math.round((progress.loaded / Math.max(1, progress.total)) * 100) : 0;

  return (
    <div className="space-y-3">
      {value && !uploading && (
        <div className="overflow-hidden rounded-lg border bg-muted">
          <video src={value} controls muted playsInline preload="metadata" className="aspect-video w-full bg-black object-contain" />
          <div className="flex items-center justify-between gap-2 border-t bg-background px-3 py-2">
            <p className="truncate font-mono text-xs text-muted-foreground">{value}</p>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 text-muted-foreground" onClick={() => onChange("")}>
              <Trash2Icon className="mr-1.5 size-3.5" /> Remove
            </Button>
          </div>
        </div>
      )}

      {uploading ? (
        <div className="space-y-2 rounded-lg border bg-muted/30 px-4 py-4" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Uploading video… {percent}%</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => xhrRef.current?.abort()}>
              <XIcon className="mr-1 size-3.5" /> Cancel
            </Button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${percent}%` }} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
          </p>
        </div>
      ) : (
        <Dropzone
          accept={VIDEO_ACCEPT}
          onFiles={(files) => files[0] && void upload(files[0])}
          title={value ? "Replace video" : "Drop a video here or click to upload"}
          hint={`MP4, WebM or MOV · max ${formatBytes(VIDEO_MAX_BYTES)} · short loops (5–20s) work best`}
          compact={Boolean(value)}
        />
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setManual((m) => !m)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LinkIcon className="size-3" /> {manual ? "Hide URL field" : "Or paste a video URL"}
        </button>
        {manual && (
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…/demo.mp4"
            aria-invalid={invalid}
            disabled={uploading}
          />
        )}
      </div>
    </div>
  );
}
