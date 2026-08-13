import Link from "next/link";
import { Leaf } from "lucide-react";
import { ROUTES } from "@/lib/constants";

/** Marketing footer. */
export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display font-bold">
              Eco<span className="text-primary">P</span>
            </span>
            <span className="text-muted-foreground">· {new Date().getFullYear()}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href={ROUTES.HOME} className="hover:text-foreground">Home</Link>
            <Link href="/#how-it-works" className="hover:text-foreground">How it works</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/register" className="hover:text-foreground">Sign up</Link>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          EcoP — Rewarding Sustainable Behaviour Through AI. The Awareness Engine never performs face
          recognition, never stores imagery, and links disposal events to users only through the QR
          session you voluntarily create.
        </p>
      </div>
    </footer>
  );
}
