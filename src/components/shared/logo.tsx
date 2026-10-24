import Link from "next/link";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

/** EcoP wordmark with an accent leaf glyph. */
export function Logo({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display",
        text,
        className,
      )}
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Leaf className="h-4 w-4" />
      </span>
      <span className="font-bold tracking-tight">
        Eco<span className="text-primary">P</span>
      </span>
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} aria-label={`${APP_NAME} home`}>
      {content}
    </Link>
  );
}
