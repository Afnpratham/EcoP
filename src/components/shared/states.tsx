import * as React from "react";
import { Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Generic empty-state used by every list/table. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button onClick={action.onClick} size="sm" className="mt-4">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

/** Generic error-state with retry. */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button onClick={onRetry} size="sm" variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Inline skeleton row for tables/lists. */
export function RowSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="skeleton h-4 flex-1" />
      ))}
    </div>
  );
}
