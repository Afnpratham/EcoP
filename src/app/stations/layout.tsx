import { Navbar } from "@/components/shared/navbar";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="container py-10">{children}</main>
    </>
  );
}
