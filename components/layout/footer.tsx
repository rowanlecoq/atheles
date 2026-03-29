import Link from "next/link";

import LogoSquare from "components/logo-square";
import { getMenu } from "lib/shopify";
import { Suspense } from "react";
import FooterMenu from "./footer-menu";

const { SITE_NAME } = process.env;

const quickLinks = [
  { title: "Store", path: "/search" },
  { title: "About", path: "/about" },
  { title: "Size Guide", path: "/size-guide" },
  { title: "FAQ", path: "/faq" },
];

const helpLinks = [
  { title: "Contact Us", path: "/contact" },
  { title: "Sizing Guide", path: "/size-guide" },
  { title: "Orders", path: "/account/orders" },
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
              Authentic Superiority
            </p>
          </div>

          {/* Column 2: Join the Team */}
          <div>
            <h3 className="mb-4 font-heading text-sm uppercase tracking-wider text-brand-gold">
              Want to join the team?
            </h3>
            <a
              href="https://forms.gle/h9KqFyp67jmGL3KM6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-grey underline-offset-4 transition-colors hover:text-brand-gold hover:underline"
            >
              apply here
            </a>
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
              Follow the brand journey.
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

          {/* Payment icons */}
          <div className="flex items-center gap-2">
            {/* Visa */}
            <svg viewBox="0 0 38 24" className="h-6 w-auto opacity-50 transition-opacity hover:opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="38" height="24" rx="3" fill="#1A1F71" />
              <path d="M15.3 15.8H13l1.4-8.6h2.3l-1.4 8.6zm7.5-8.4c-.5-.2-1.2-.4-2.1-.4-2.3 0-3.9 1.2-3.9 2.9 0 1.3 1.2 2 2 2.4.9.4 1.2.7 1.2 1.1 0 .6-.7.9-1.4.9-1 0-1.5-.1-2.3-.5l-.3-.2-.3 2c.6.3 1.6.5 2.7.5 2.4 0 4-1.2 4-3 0-1-.6-1.8-2-2.4-.8-.4-1.3-.7-1.3-1.1 0-.4.4-.8 1.3-.8.7 0 1.3.2 1.7.3l.2.1.5-1.8zm5.8-.2h-1.8c-.5 0-1 .2-1.2.7l-3.4 8.1h2.4l.5-1.3h2.9l.3 1.3h2.1l-1.8-8.8zm-2.8 5.7l1.2-3.2.3 1 .5 2.2h-2zm-11.5-5.7L12.1 13l-.2-1.2c-.4-1.4-1.7-2.9-3.2-3.7l2.1 7.7h2.4l3.7-8.6h-2.6z" fill="white" />
              <path d="M9.6 7.2H6l0 .2c2.9.7 4.8 2.5 5.6 4.6l-.8-4.1c-.1-.5-.5-.7-1.2-.7z" fill="#F9A533" />
            </svg>
            {/* Mastercard */}
            <svg viewBox="0 0 38 24" className="h-6 w-auto opacity-50 transition-opacity hover:opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="38" height="24" rx="3" fill="#252525" />
              <circle cx="15" cy="12" r="7" fill="#EB001B" />
              <circle cx="23" cy="12" r="7" fill="#F79E1B" />
              <path d="M19 6.7a7 7 0 0 1 2.6 5.3A7 7 0 0 1 19 17.3a7 7 0 0 1-2.6-5.3A7 7 0 0 1 19 6.7z" fill="#FF5F00" />
            </svg>
            {/* Apple Pay */}
            <svg viewBox="0 0 38 24" className="h-6 w-auto opacity-50 transition-opacity hover:opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="38" height="24" rx="3" fill="#000" />
              <path d="M13.3 8.3c.3-.4.5-.9.5-1.4-.5 0-1.1.3-1.4.7-.3.3-.6.9-.5 1.4.5 0 1.1-.3 1.4-.7zm.4.8c-.8 0-1.5.4-1.8.4-.4 0-1-.4-1.6-.4-.8 0-1.6.5-2 1.2-.9 1.5-.2 3.7.6 4.9.4.6.9 1.2 1.5 1.2.6 0 .8-.4 1.6-.4.7 0 .9.4 1.5.4.7 0 1.1-.6 1.5-1.2.5-.7.7-1.4.7-1.4-.8-.3-1-1.3-.9-1.3 0-1 .8-1.5.8-1.5-.4-.7-1.1-.8-1.4-.9h.5zm5.6-.7h-1.8l-1.2 4.2-.1.4h0l-.1-.4-1.2-4.2h-1.9l2.2 6.5-.1.3c-.2.5-.5.7-.9.7-.2 0-.3 0-.4 0v1.4c.2 0 .4.1.7.1.9 0 1.6-.4 2.1-1.6l2.7-7.4z" fill="white" />
            </svg>
            {/* Shop Pay */}
            <div className="flex h-6 items-center rounded bg-[#5A31F4] px-1.5 opacity-50 transition-opacity hover:opacity-80">
              <span className="text-[10px] font-bold text-white">Shop</span>
              <span className="ml-0.5 text-[10px] font-bold text-white/70">Pay</span>
            </div>
          </div>

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
