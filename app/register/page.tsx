import Footer from "components/layout/footer";
import { RegisterForm } from "./register-form";
import type { Metadata } from "next";
import Link from "next/link";

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
              Create Account
            </h1>
            <p className="text-sm text-brand-grey">
              Join the ATHELES club.
            </p>
          </div>
          <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
            <RegisterForm />
            <div className="mt-6 text-center">
              <p className="text-xs text-brand-grey">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-brand-gold underline underline-offset-4 hover:text-brand-light-gold"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
