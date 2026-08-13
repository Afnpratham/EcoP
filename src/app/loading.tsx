import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-12">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="font-display text-lg font-medium text-muted-foreground">
          Loading...
        </span>
      </div>
      <div className="mt-6 w-full max-w-md space-y-3">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
