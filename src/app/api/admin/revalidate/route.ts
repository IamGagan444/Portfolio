import { adminRoute, ok } from "@/lib/api/handler";
import { invalidateAll } from "@/lib/cache";

/** Manually purges every cached public page (normally done automatically on save). */
export const POST = adminRoute(async () => {
  invalidateAll();
  return ok({ revalidated: true });
});
