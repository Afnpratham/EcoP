import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track your eco impact, points, achievements and activity.",
};

export default function DashboardLayout({
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
