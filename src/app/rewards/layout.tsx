import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";

export const metadata: Metadata = {
  title: "Rewards",
  description: "Redeem your Eco Points for real campus rewards.",
};

export default function RewardsLayout({
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
