import Footer from "components/layout/footer";
import type { Metadata } from "next";
import Link from "next/link";

const SHOPIFY_ACCOUNT_URL = "https://shopify.com/69415501955/account";

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
            <p className="mb-2 text-sm text-brand-grey">
              join the atheles club.
            </p>
            <p className="text-xs text-brand-grey/60">
              create your account with shop pay, google, or facebook.
            </p>
          </div>
          <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8">
            <div className="space-y-4">
              {/* Shop Pay sign up */}
              <a
                href={SHOPIFY_ACCOUNT_URL}
                className="flex w-full items-center justify-center gap-3 rounded bg-[#5A31F4] px-6 py-3 font-heading text-sm uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.39 2.08c-.47.07-.88.21-1.24.42-.36.21-.68.49-.96.84-.28.35-.5.76-.65 1.22-.15.47-.23.98-.23 1.53v.27c0 .05.02.1.05.13.03.04.08.06.13.06h1.91c.1 0 .17-.07.17-.17v-.35c0-.48.09-.87.26-1.18.17-.31.43-.47.78-.47.23 0 .42.08.56.25.14.17.21.4.21.69 0 .33-.08.63-.25.92-.17.29-.38.56-.64.83-.26.27-.54.53-.84.8-.3.27-.56.56-.79.87-.23.31-.41.66-.55 1.04-.14.39-.21.84-.21 1.36v.48c0 .1.07.17.17.17h1.91c.1 0 .17-.07.17-.17v-.41c0-.34.06-.64.17-.9.11-.26.26-.5.44-.73.18-.23.38-.44.6-.64.22-.2.44-.41.66-.64.22-.23.43-.48.63-.76.2-.28.37-.6.51-.97.14-.37.21-.79.21-1.27 0-.52-.09-.98-.28-1.38-.19-.4-.44-.73-.76-1-.32-.27-.69-.47-1.11-.61-.42-.14-.87-.21-1.34-.21-.15 0-.34.02-.56.06zM12.11 15.39c-.41 0-.75.14-1.02.41-.27.27-.41.61-.41 1.02s.14.75.41 1.02c.27.27.61.41 1.02.41s.75-.14 1.02-.41c.27-.27.41-.61.41-1.02s-.14-.75-.41-1.02c-.27-.27-.61-.41-1.02-.41z" />
                </svg>
                sign up with shop
              </a>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-brand-dark-gold/20" />
                <span className="text-[10px] uppercase tracking-wider text-brand-grey/50">or</span>
                <div className="h-px flex-1 bg-brand-dark-gold/20" />
              </div>

              {/* Direct Shopify account link */}
              <a
                href={SHOPIFY_ACCOUNT_URL}
                className="block w-full rounded border border-brand-gold bg-transparent px-6 py-3 text-center font-heading text-sm uppercase tracking-wider text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-dark"
              >
                continue to create account
              </a>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-brand-grey">
                already have an account?{" "}
                <Link
                  href="/login"
                  className="text-brand-gold underline underline-offset-4 hover:text-brand-light-gold"
                >
                  sign in
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
