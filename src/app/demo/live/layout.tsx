import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";

export const metadata: Metadata = {
  title: "Live AI Demo",
  description: "Authenticated live Awareness Engine observation console.",
};

export default function LiveDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="container py-8 sm:py-10">{children}</main>
    </>
  );
}
