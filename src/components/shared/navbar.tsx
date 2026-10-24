import Link from "next/link";
import { getServerProfile } from "@/lib/supabase/server";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NavbarUserMenu } from "@/components/shared/navbar-user-menu";
import { AppNavigation } from "@/components/shared/app-navigation";
import { RuntimeBanner } from "@/components/shared/runtime-banner";
import { isDemoMode } from "@/lib/runtime";
export async function Navbar() {
  const profile = await getServerProfile().catch(() => null);
  const demo = isDemoMode();
  const liveCameraObservation =
    demo &&
    process.env.ECOP_LIVE_DEMO_LOCAL === "true" &&
    process.env.NODE_ENV !== "production";
  return (
    <>
      <RuntimeBanner demo={demo} liveCameraObservation={liveCameraObservation} />
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between gap-3">
          <Logo />
          <div className="hidden text-xs font-medium uppercase tracking-[.18em] text-muted-foreground lg:block">
            Small actions. Lasting change.
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {profile ? (
              <NavbarUserMenu
                name={profile.full_name}
                email={profile.email}
                avatarUrl={profile.avatar_url}
                ecoPoints={profile.eco_points}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3 py-2 text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="container pb-3">
          <AppNavigation />
        </div>
      </header>
    </>
  );
}
