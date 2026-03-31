import Footer from "components/layout/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "our athletes",
  description:
    "meet the athletes who represent atheles. want to be part of the team? apply here.",
};

export default function AthletesPage() {
  return (
    <>
      <div className="mx-auto min-h-[calc(100vh-200px)] max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="mb-2 font-heading text-3xl uppercase tracking-wider text-brand-gold sm:text-4xl">
          our athletes.
        </h1>
        <div className="mb-8 h-px w-24 bg-brand-dark-gold/40" />

        <p className="mb-10 max-w-xl text-sm leading-relaxed text-brand-grey">
          the individuals who embody what atheles stands for — discipline,
          authenticity, and the relentless pursuit of greatness. this is the
          team pushing the new era forward.
        </p>

        {/* Coming soon state */}
        <div className="mb-12 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-dark-gold/10">
              <span className="text-2xl">🔱</span>
            </div>
          </div>
          <p className="mb-1 font-heading text-lg text-brand-pale-gold">
            coming soon.
          </p>
          <p className="text-sm text-brand-grey">
            our athlete roster is being built. check back soon.
          </p>
        </div>

        {/* Apply section */}
        <div className="rounded-lg border border-brand-gold/20 bg-gradient-to-br from-brand-dark-gold/5 to-transparent p-8 text-center">
          <h2 className="mb-2 font-heading text-xl text-brand-gold">
            want to represent atheles?
          </h2>
          <p className="mb-6 text-sm text-brand-grey">
            we&apos;re looking for driven individuals who live the lifestyle.
            if that&apos;s you, reach out — let&apos;s build something together.
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-full bg-brand-gold px-8 py-3 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90"
          >
            apply now
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
