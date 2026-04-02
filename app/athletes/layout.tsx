import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "our athletes",
  description:
    "meet the athletes who represent atheles. want to be part of the team? apply here.",
};

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
