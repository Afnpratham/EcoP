import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your EcoP account and start earning Eco Points.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
