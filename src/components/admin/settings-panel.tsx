"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/admin/api-client";
import { queryKeys } from "@/lib/admin/resources";
import { formatBytes } from "@/lib/format";
import { type ChangePasswordInput, changePasswordSchema, PASSWORD_MIN_LENGTH } from "@/lib/validations/auth";

import { ConfirmDialog } from "./confirm-dialog";
import { Field, FormSection } from "./form/field";
import { handleFormError } from "./form/server-errors";
import { PageHeader } from "./page-header";

export function SettingsPanel({ admin }: { admin: { name: string; email: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Account security and site maintenance." />
      <FormSection title="Account">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Name</dt>
            <dd>{admin.name}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Email</dt>
            <dd>{admin.email}</dd>
          </div>
        </dl>
      </FormSection>
      <ChangePassword />
      <CacheControl />
      <MediaCleanup />
    </div>
  );
}

function ChangePassword() {
  const { register, handleSubmit, setError, formState } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = formState;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api("/api/admin/account/password", { method: "PATCH", json: values });
      toast.success("Password changed. Please sign in again.");
      // Every session (including this one) was revoked server-side.
      window.location.assign("/admin/login");
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  return (
    <FormSection title="Change password" description="Changing your password signs out all sessions, including this one.">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:max-w-md">
        <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
          <Input id="currentPassword" type="password" autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...register("currentPassword")} />
        </Field>
        <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message} hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}>
          <Input id="newPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.newPassword} {...register("newPassword")} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
        </Field>
        <div>
          <Button type="submit" disabled={isSubmitting} className="min-w-36">
            {isSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : "Update password"}
          </Button>
        </div>
      </form>
    </FormSection>
  );
}

function CacheControl() {
  const purge = useMutation({
    mutationFn: () => api("/api/admin/revalidate", { method: "POST" }),
    onSuccess: () => toast.success("Public pages will be rebuilt on the next visit"),
    onError: (error) => toast.error(errorMessage(error)),
  });
  return (
    <FormSection title="Public site cache" description="Saving content already refreshes the affected pages. Use this if something looks out of date.">
      <Button variant="outline" onClick={() => purge.mutate()} disabled={purge.isPending}>
        {purge.isPending ? <Loader2Icon className="size-4 animate-spin" /> : "Refresh all public pages"}
      </Button>
    </FormSection>
  );
}

function MediaCleanup() {
  const [confirming, setConfirming] = useState(false);
  const scan = useQuery({
    queryKey: queryKeys.media,
    queryFn: () => api<{ count: number; bytes: number }>("/api/admin/media"),
    enabled: false,
  });
  const clean = useMutation({
    mutationFn: () => api<{ deleted: number }>("/api/admin/media", { method: "DELETE" }),
    onSuccess: (r) => {
      toast.success(`Deleted ${r.deleted} unused file${r.deleted === 1 ? "" : "s"}`);
      return scan.refetch();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <FormSection
      title="Unused media"
      description="Find uploads no longer used by any record (e.g. from forms that were never saved). Files uploaded in the last hour are ignored."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => scan.refetch()} disabled={scan.isFetching}>
          {scan.isFetching ? <Loader2Icon className="size-4 animate-spin" /> : "Scan storage"}
        </Button>
        {scan.isError && <span className="text-sm text-destructive">{scan.error.message}</span>}
        {scan.data && (
          <>
            <span className="font-mono text-xs text-muted-foreground">
              {scan.data.count} unused file{scan.data.count === 1 ? "" : "s"} · {formatBytes(scan.data.bytes)}
            </span>
            {scan.data.count > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setConfirming(true)} disabled={clean.isPending}>
                Delete unused
              </Button>
            )}
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete unused files?"
        description={`${scan.data?.count ?? 0} files will be permanently deleted from storage.`}
        onConfirm={() => {
          clean.mutate();
          setConfirming(false);
        }}
      />
    </FormSection>
  );
}
