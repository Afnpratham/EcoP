"use client";

import { motion } from "framer-motion";
import { ServerCrash, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ServerCrash className="h-10 w-10" />
          </div>
          <h1 className="font-display text-5xl font-bold">500</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Something went wrong on our end.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ve been notified and are working to fix it.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button onClick={reset} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button asChild className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </body>
    </html>
  );
}
