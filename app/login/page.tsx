import Footer from "components/layout/footer";
import { LoginForm } from "./login-form";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your ATHELES account.",
};

export default function LoginPage() {
  return (
    <>
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-10 sm:py-12">
        <div className="w-full">
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-heading text-3xl text-brand-gold sm:text-4xl">
              Sign In
            </h1>
            <p className="text-sm text-brand-grey">
              Welcome back to ATHELES.
            </p>
          </div>
          <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
            <LoginForm />
            <div className="mt-6 text-center">
              <p className="text-xs text-brand-grey">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-brand-gold underline underline-offset-4 hover:text-brand-light-gold"
                >
                  Create one
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
