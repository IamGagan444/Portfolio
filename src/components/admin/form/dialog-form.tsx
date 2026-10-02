"use client";

import { Loader2Icon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";

import { useUnsavedChanges } from "../hooks/use-unsaved-changes";

type DialogFormProps = {
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  isDirty: boolean;
  isSubmitting: boolean;
  submitLabel?: string;
  children: React.ReactNode;
};

/** Form body + sticky footer for edit dialogs, with unsaved-change tracking. */
export function DialogForm({
  onSubmit,
  onCancel,
  isDirty,
  isSubmitting,
  submitLabel = "Save",
  children,
}: DialogFormProps) {
  const id = useId();
  useUnsavedChanges(id, isDirty && !isSubmitting);

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-4">{children}</DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-24">
          {isSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
