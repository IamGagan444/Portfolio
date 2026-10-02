import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiClientError, errorMessage } from "@/lib/admin/api-client";

/** Shows API validation errors on their fields and a toast for the overall failure. */
export function handleFormError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>) {
  if (error instanceof ApiClientError && error.errors) {
    for (const [path, message] of Object.entries(error.errors)) {
      setError(path as Path<T>, { type: "server", message });
    }
  }
  toast.error(errorMessage(error));
}
