import { Navbar } from "@/components/shared/navbar";

export default function BinLayout({
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
