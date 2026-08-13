import Link from "next/link";
import { getServerProfile } from "@/lib/supabase/server";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NavbarUserMenu } from "@/components/shared/navbar-user-menu";
import { ROUTES } from "@/lib/constants";

/** Top navigation bar. Server component — resolves auth state on the server. */
export async function Navbar() {
  const profile = await getServerProfile().catch(() => null);
  const isAuthed = Boolean(profile);

  const links = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#impact", label: "Impact" },
    { href: "/#faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          {isAuthed ? (
            <Link
              href={ROUTES.DASHBOARD}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthed ? (
            <NavbarUserMenu
              name={profile!.full_name}
              email={profile!.email}
              avatarUrl={profile!.avatar_url}
              ecoPoints={profile!.eco_points}
            />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href={ROUTES.LOGIN}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
