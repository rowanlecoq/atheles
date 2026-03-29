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
            <svg viewBox="0 0 750 471" className="h-6 w-auto opacity-40 transition-opacity hover:opacity-70" aria-label="Visa">
              <rect width="750" height="471" rx="40" fill="#1a1f71"/>
              <path d="M278.2 334.2h-60.6l37.9-233.9h60.6L278.2 334.2zM524.7 106.2c-12-4.5-30.9-9.4-54.4-9.4-60 0-102.2 31.9-102.5 77.5-.3 33.7 30.1 52.5 53.1 63.7 23.6 11.5 31.5 18.8 31.4 29.1-.2 15.7-18.8 22.9-36.2 22.9-24.2 0-37.1-3.5-57-12.2l-7.8-3.7-8.5 52.4c14.2 6.5 40.4 12.2 67.6 12.5 63.8 0 105.3-31.5 105.7-80.2.2-26.7-15.9-47.1-50.9-63.9-21.2-10.9-34.2-18.1-34.1-29.1.1-10 11-20.4 34.7-20.4 19.8-.3 34.2 4.2 45.4 9l5.4 2.7 8.2-50.9-.1-.1z" fill="#fff"/>
              <path d="M661.6 100.3h-46.9c-14.5 0-25.4 4.2-31.8 19.5l-90.1 215.4h63.7s10.4-28.9 12.8-35.3h77.8c1.8 8.2 7.4 35.3 7.4 35.3H712L661.6 100.3zm-74.9 185.4c5-13.6 24.3-65.8 24.3-65.8-.4.6 5-13.7 8.1-22.6l4.1 20.4 14.1 68H581.2l5.5-0z" fill="#fff"/>
              <path d="M232.8 100.3L173.5 261l-6.4-32.4c-11-37.5-45.5-78.2-84-98.5l54.3 204h64.2l95.4-233.8h-64.3z" fill="#fff"/>
              <path d="M131.9 100.3H37.5l-.8 4.7c76.1 19.4 126.5 66.4 147.4 122.8L163 125.5c-3.5-14.7-14.3-19.6-31.1-25.2z" fill="#f9a533"/>
            </svg>
            {/* Mastercard */}
            <svg viewBox="0 0 152.407 108" className="h-6 w-auto opacity-40 transition-opacity hover:opacity-70" aria-label="Mastercard">
              <rect width="152.407" height="108" rx="12" fill="#252525"/>
              <circle cx="60.4" cy="54" r="28" fill="#eb001b"/>
              <circle cx="92" cy="54" r="28" fill="#f79e1b"/>
              <path d="M76.2 31.5a28 28 0 0 1 10.2 22.5 28 28 0 0 1-10.2 22.5 28 28 0 0 1-10.2-22.5 28 28 0 0 1 10.2-22.5z" fill="#ff5f00"/>
            </svg>
            {/* Apple Pay */}
            <div className="flex h-6 items-center rounded bg-brand-grey/10 px-2 opacity-40 transition-opacity hover:opacity-70">
              <svg viewBox="0 0 43 18" className="h-3 w-auto" fill="currentColor" aria-label="Apple Pay">
                <path d="M7.3 3.3c-.5.6-1.2 1-2 .9-.1-.8.3-1.6.7-2.1C6.6 1.5 7.3 1 8 1c.1.8-.2 1.6-.7 2.3zm.7 1.2c-1.1-.1-2.1.6-2.6.6s-1.4-.6-2.3-.6C1.7 4.6.3 6.1.3 9c0 1.8.7 3.7 1.6 5 .7 1 1.6 2.2 2.8 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7c1.2 0 2-1 2.7-2 .5-.7.9-1.5 1.1-2.3-2.5-1-2.9-4.6-.4-6z" className="text-brand-grey"/>
                <path d="M17.7 4.8h-3l-1.3 3.8h-.1L12 4.8H9.2l3 7.2-1.6 4.5h2.7l4.4-11.7zm3.3 8c1.8 0 3.2-1 3.2-2.5h-2.3c-.1.7-.7 1.2-1.4 1.2-.9 0-1.5-.7-1.5-2s.6-2 1.5-2c.7 0 1.2.4 1.4 1.1h2.3c-.1-1.5-1.4-2.4-3.2-2.4-2.1 0-3.5 1.4-3.5 3.3s1.4 3.3 3.5 3.3zm4.5 3.7h2.3c-.1-.3-.2-.9-.2-1.4V6.4h-2.3V15c0 .6.1 1.2.2 1.5zm6.3-3.7c1.7 0 2.9-1.1 3-2.5h-2.2c-.1.6-.5 1.1-1.1 1.1-.8 0-1.3-.7-1.3-2s.5-2 1.3-2c.6 0 1 .4 1.1 1h2.2c-.1-1.4-1.3-2.4-3-2.4-2 0-3.3 1.4-3.3 3.3s1.3 3.5 3.3 3.5z" className="text-brand-grey"/>
              </svg>
            </div>
            {/* Shop Pay */}
            <div className="flex h-6 items-center rounded bg-[#5A31F4]/20 px-2 opacity-50 transition-opacity hover:opacity-70">
              <span className="text-xs font-bold text-[#5A31F4]/70">Shop</span>
            </div>
            {/* Google Pay */}
            <div className="flex h-6 items-center rounded bg-brand-grey/10 px-2 opacity-40 transition-opacity hover:opacity-70">
              <span className="text-xs font-medium text-brand-grey/70">G Pay</span>
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
