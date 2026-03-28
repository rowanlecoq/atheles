import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "profile",
  description: "Your ATHELES profile.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
