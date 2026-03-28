import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "sign in",
  description: "Sign in to your ATHELES account.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
