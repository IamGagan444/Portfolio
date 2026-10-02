"use client";

import { useEffect, useSyncExternalStore } from "react";

/*
 * Tracks whether any admin form has unsaved edits. Used to warn before closing
 * the tab (beforeunload) and before in-app navigation (sidebar links, dialogs).
 */

const dirtySources = new Set<string>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasUnsavedChanges() {
  return dirtySources.size > 0;
}

export const DISCARD_MESSAGE = "You have unsaved changes. Discard them?";

/** Returns true when it is safe to navigate away (nothing dirty, or the user agreed to discard). */
export function confirmDiscard(): boolean {
  if (!hasUnsavedChanges()) return true;
  const ok = window.confirm(DISCARD_MESSAGE);
  if (ok) {
    dirtySources.clear();
    emit();
  }
  return ok;
}

export function useUnsavedChanges(id: string, dirty: boolean) {
  useEffect(() => {
    if (dirty) dirtySources.add(id);
    else dirtySources.delete(id);
    emit();
    return () => {
      dirtySources.delete(id);
      emit();
    };
  }, [id, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

export function useHasUnsavedChanges() {
  return useSyncExternalStore(subscribe, hasUnsavedChanges, () => false);
}
