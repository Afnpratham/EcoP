import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the top recyclers on campus.",
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="container py-8">{children}</main>
    </>
  );
}
