import Footer from "components/layout/footer";
import { LoginForm } from "components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "sign in",
  description: "Sign in to your ATHELES account.",
};

export default function LoginPage() {
  return (
    <>
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-10 sm:py-12">
        <div className="w-full">
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-heading text-3xl text-brand-gold sm:text-4xl">
              sign in
            </h1>
            <p className="text-sm text-brand-grey">welcome back to atheles.</p>
          </div>
          <LoginForm />
        </div>
      </div>
      <Footer />
    </>
  );
}
