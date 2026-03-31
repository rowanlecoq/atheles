import Footer from "components/layout/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | my account",
    default: "my account",
  },
};

const accountNav = [
  { title: "orders", path: "/account" },
  { title: "help & faq", path: "/account/order-help" },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto min-h-[calc(100vh-200px)] max-w-5xl px-4 py-10 sm:py-12">
        <h1 className="mb-8 font-heading text-3xl text-brand-gold sm:text-4xl">
          my account
        </h1>
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar */}
          <nav className="w-full flex-none md:w-48">
            <ul className="space-y-1">
              {accountNav.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className="block rounded px-4 py-2.5 text-sm text-brand-grey transition-colors hover:bg-brand-medium-grey/10 hover:text-brand-gold"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="min-h-[400px] flex-1">{children}</div>
        </div>
      </div>
      <Footer />
    </>
  );
}
