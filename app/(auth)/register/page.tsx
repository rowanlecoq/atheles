import Footer from "components/layout/footer";
import { RegisterForm } from "components/auth/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "create account",
  description: "Create your ATHELES account and join the club.",
};

export default function RegisterPage() {
  return (
    <>
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-10 sm:py-12">
        <div className="w-full">
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-heading text-3xl text-brand-gold sm:text-4xl">
              create account
            </h1>
            <p className="text-sm text-brand-grey">join the atheles club.</p>
          </div>
          <RegisterForm />
        </div>
      </div>
      <Footer />
    </>
  );
}
