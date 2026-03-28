import Link from "next/link";

export const metadata = {
  title: "Register",
  description: "Create your Atheles account.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-serif text-3xl tracking-wide text-brand-gold">
          Register
        </h1>
        <p className="mt-4 text-brand-grey">
          Account registration is coming soon.
        </p>
        <p className="mt-6 text-sm text-brand-grey/70">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-gold underline underline-offset-4 transition-colors hover:text-brand-light-gold"
          >
            Login
          </Link>
        </p>
        <p className="mt-4 text-sm text-brand-grey/70">
          <Link
            href="/"
            className="text-brand-gold underline underline-offset-4 transition-colors hover:text-brand-light-gold"
          >
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
