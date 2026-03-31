import Link from "next/link";

import LogoSquare from "components/logo-square";
import { getMenu } from "lib/shopify";
import { Suspense } from "react";
import FooterMenu from "./footer-menu";

const { SITE_NAME } = process.env;

const quickLinks = [
  { title: "Store", path: "/search" },
  { title: "About", path: "/about" },
  { title: "Our Athletes", path: "/athletes" },
  { title: "Size Guide", path: "/size-guide" },
  { title: "FAQ", path: "/faq" },
];

const helpLinks = [
  { title: "Contact Us", path: "/contact" },
  { title: "Sizing Guide", path: "/size-guide" },
  { title: "Orders", path: "/account/order-help" },
  { title: "Returns", path: "/returns" },
  { title: "FAQ", path: "/faq" },
];

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2025 + (currentYear > 2025 ? `-${currentYear}` : "");
  const skeleton =
    "w-full h-6 animate-pulse rounded-sm bg-brand-medium-grey/30";
  const menu = await getMenu("next-js-frontend-footer-menu");

  return (
    <footer className="animate-footer-enter border-t border-brand-dark-gold/20 bg-brand-dark text-sm text-brand-grey">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:px-4 min-[1320px]:px-0">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Logo + Tagline */}
          <div className="space-y-4">
            <Link className="flex items-center" href="/">
              <LogoSquare size="sm" />
            </Link>
            <p className="text-xs uppercase tracking-[0.14em] text-brand-pale-gold sm:tracking-[0.2em]">
              AUTHENTIC SUPERIORITY.
            </p>
          </div>

          {/* Column 2: The Team */}
          <div>
            <h3 className="mb-4 font-heading text-sm uppercase tracking-wider text-brand-gold">
              Atheles Team
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/athletes"
                  className="text-sm text-brand-grey underline-offset-4 transition-colors hover:text-brand-gold hover:underline"
                >
                  our athletes
                </Link>
              </li>
              <li>
                <a
                  href="https://forms.gle/h9KqFyp67jmGL3KM6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-grey underline-offset-4 transition-colors hover:text-brand-gold hover:underline"
                >
                  careers
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Help / Shopify Menu */}
          <div>
            <h3 className="mb-4 font-heading text-sm uppercase tracking-wider text-brand-gold">
              Need Help?
            </h3>
            <ul className="space-y-2">
              {helpLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-brand-grey hover:text-brand-gold hover:underline underline-offset-4 transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
            {menu.length > 0 && (
              <div className="mt-4">
                <Suspense
                  fallback={
                    <div className="flex flex-col gap-2">
                      <div className={skeleton} />
                      <div className={skeleton} />
                      <div className={skeleton} />
                    </div>
                  }
                >
                  <FooterMenu menu={menu} />
                </Suspense>
              </div>
            )}
          </div>

          {/* Column 4: Newsletter + Social */}
          <div>
            <h3 className="mb-4 font-heading text-sm uppercase tracking-wider text-brand-gold">
              Follow Our Socials
            </h3>
            <p className="mb-4 text-xs text-brand-grey">
              be part of the new era.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/atheles.co/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-brand-grey transition-colors hover:text-brand-gold"
              >
                <span className="sr-only">Instagram</span>
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/atheles"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-brand-grey transition-colors hover:text-brand-gold"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-brand-dark-gold/20" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-4 text-center text-xs text-brand-grey md:flex-row md:justify-between md:text-left">
          <p className="max-w-sm">
            &copy; {copyrightDate} atheles. all rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/shipping"
              className="hover:text-brand-gold transition-colors"
            >
              shipping policy
            </Link>
            <Link
              href="/returns"
              className="hover:text-brand-gold transition-colors"
            >
              returns policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
