import { ListSkeleton } from "@/components/admin/states";
import { Skeleton } from "@/components/ui/skeleton";

export default function CmsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b pb-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <ListSkeleton />
    </div>
  );
}
