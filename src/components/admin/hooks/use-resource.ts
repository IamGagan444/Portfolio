"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, errorMessage } from "@/lib/admin/api-client";
import { type ListResult, queryKeys, RESOURCE_ENDPOINTS, type ResourceName } from "@/lib/admin/resources";

type WithId = { id: string };

export function useResourceList<T extends WithId>(resource: ResourceName) {
  return useQuery({
    queryKey: queryKeys.list(resource),
    queryFn: () => api<ListResult<T>>(`${RESOURCE_ENDPOINTS[resource]}?limit=200`).then((r) => r.items),
  });
}

export function useResourceItem<T extends WithId>(resource: ResourceName, id: string) {
  return useQuery({
    queryKey: queryKeys.item(resource, id),
    queryFn: () => api<T>(`${RESOURCE_ENDPOINTS[resource]}/${id}`),
    enabled: Boolean(id),
  });
}

/**
 * Create/update/delete/reorder mutations for a resource. Toggles, deletes and
 * reorders update the cached list optimistically and roll back on failure.
 */
export function useResourceMutations<T extends WithId>(resource: ResourceName) {
  const qc = useQueryClient();
  const base = RESOURCE_ENDPOINTS[resource];
  const listKey = queryKeys.list(resource);

  const snapshot = async () => {
    await qc.cancelQueries({ queryKey: listKey });
    return qc.getQueryData<T[]>(listKey);
  };
  const rollback = (previous: T[] | undefined) => {
    if (previous) qc.setQueryData(listKey, previous);
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", resource] });

  const create = useMutation({
    mutationFn: (data: unknown) => api<T>(base, { method: "POST", json: data }),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<T> | Record<string, unknown> }) =>
      api<T>(`${base}/${id}`, { method: "PATCH", json: data }),
    onMutate: async ({ id, data }) => {
      const previous = await snapshot();
      qc.setQueryData<T[]>(listKey, (items) =>
        items?.map((item) => (item.id === id ? ({ ...item, ...data } as T) : item)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => rollback(context?.previous),
    onSuccess: (updated) => {
      qc.setQueryData<T[]>(listKey, (items) => items?.map((item) => (item.id === updated.id ? updated : item)));
      qc.setQueryData(queryKeys.item(resource, updated.id), updated);
    },
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api<{ id: string }>(`${base}/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      const previous = await snapshot();
      qc.setQueryData<T[]>(listKey, (items) => items?.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (error, _id, context) => {
      rollback(context?.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: () => toast.success("Deleted"),
    onSettled: refresh,
  });

  const reorder = useMutation({
    mutationFn: (items: T[]) =>
      api(`${base}/reorder`, { method: "PATCH", json: { ids: items.map((item) => item.id) } }),
    onMutate: async (items) => {
      const previous = await snapshot();
      qc.setQueryData<T[]>(listKey, items.map((item, order) => ({ ...item, order })));
      return { previous };
    },
    onError: (error, _items, context) => {
      rollback(context?.previous);
      toast.error(errorMessage(error));
    },
    onSettled: refresh,
  });

  return { create, update, remove, reorder };
}
