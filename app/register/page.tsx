import type { Metadata } from "next";
import Footer from "components/layout/footer";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "register",
};

export default function RegisterPage() {
  return (
    <>
      <RegisterForm />
      <Footer />
    </>
  );
}
