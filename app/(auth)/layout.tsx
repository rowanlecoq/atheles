import { AuthSessionProvider } from "components/auth/session-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
