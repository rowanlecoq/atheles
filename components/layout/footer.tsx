import Link from "next/link";

import LogoSquare from "components/logo-square";
import { getMenu } from "lib/shopify";
import { Suspense } from "react";
import FooterMenu from "./footer-menu";

const { SITE_NAME } = process.env;
const copyrightDate = (() => {
  const y = new Date().getFullYear();
  return 2025 + (y > 2025 ? `-${y}` : "");
})();

const quickLinks = [
  { title: "Store", path: "/search" },
  { title: "Our Athletes", path: "/athletes" },
  { title: "Size Guide", path: "/size-guide" },
  { title: "FAQ", path: "/faq" },
];

const helpLinks = [
  { title: "Contact Us", path: "/contact" },
  { title: "Sizing Guide", path: "/size-guide" },
  { title: "Orders", path: "/orders" },
  { title: "Returns", path: "/returns" },
  { title: "FAQ", path: "/faq" },
];

export default async function Footer() {
  const skeleton =
    "w-full h-6 animate-pulse rounded-sm bg-brand-medium-grey/30";
  const menu = await getMenu("next-js-frontend-footer-menu");

  return (
    <footer className="border-t border-brand-dark-gold/20 bg-brand-dark text-sm text-brand-grey">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 min-[1320px]:px-0">
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
                href="https://www.tiktok.com/@atheles.co"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-brand-grey transition-colors hover:text-brand-gold"
              >
                <span className="sr-only">TikTok</span>
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.12a8.16 8.16 0 0 0 4.83 1.55V7.22a4.85 4.85 0 0 1-1.06-.53z" />
                </svg>
              </a>
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
              <a
                href="https://discord.com/invite/MQCvChqPzN"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="text-brand-grey transition-colors hover:text-brand-gold"
              >
                <span className="sr-only">Discord</span>
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="-1 -1 26 26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963a.075.075 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.03z" />
                  <path d="M8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38z" />
                  <path d="M15.98 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
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
