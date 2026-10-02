"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

import { ApiClientError } from "@/lib/admin/api-client";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            // Don't retry client errors (validation, auth, not found).
            retry: (count, error) =>
              !(error instanceof ApiClientError && error.status >= 400 && error.status < 500) && count < 2,
          },
          mutations: { retry: false },
        },
      })
  );
  const { resolvedTheme } = useTheme();

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="bottom-right"
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        toastOptions={{ className: "font-sans text-sm" }}
        closeButton
      />
    </QueryClientProvider>
  );
}
