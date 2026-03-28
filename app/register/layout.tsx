import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "create account",
  description: "Create your ATHELES account and join the club.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
