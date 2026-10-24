"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  ScanLine,
  Gift,
  Trophy,
  UserRound,
} from "lucide-react";
const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/stations", label: "Stations", icon: MapPin },
  { href: "/impact", label: "Impact & receipts", icon: ScanLine },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/leaderboard", label: "Community", icon: Trophy },
  { href: "/profile", label: "Profile", icon: UserRound },
];
export function AppNavigation() {
  const path = usePathname();
  return (
    <nav aria-label="Workspace" className="flex gap-1 overflow-x-auto pb-1">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${path === href ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
