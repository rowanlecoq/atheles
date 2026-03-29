import { Metadata } from "next";
import ResetForm from "./reset-form";

export const metadata: Metadata = {
  title: "reset password | atheles",
};

export default async function ResetPasswordPage(props: {
  params: Promise<{ id: string; token: string }>;
}) {
  const params = await props.params;
  return <ResetForm customerId={params.id} resetToken={params.token} />;
}
