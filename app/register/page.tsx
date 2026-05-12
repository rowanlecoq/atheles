import type { Metadata } from "next";
import Footer from "components/layout/footer";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "register",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <>
      <RegisterForm />
      <Footer />
    </>
  );
}
