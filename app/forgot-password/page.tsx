import type { Metadata } from "next";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "forgot password | atheles",
  description: "Reset your atheles account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
