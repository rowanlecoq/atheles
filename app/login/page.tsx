import type { Metadata } from "next";
import Footer from "components/layout/footer";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "login",
};

export default function LoginPage() {
  return (
    <>
      <LoginForm />
      <Footer />
    </>
  );
}
