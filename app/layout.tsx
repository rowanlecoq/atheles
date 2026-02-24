import { CartProvider } from "components/cart/cart-context";
import { CustomCursor } from "components/custom-cursor";
import { KonamiLightning } from "components/easter-eggs/konami-lightning";
import { Navbar } from "components/layout/navbar";
import { PageTransition } from "components/page-transition";
import { ScrollProgress } from "components/scroll-progress";
import { SmoothScrollProvider } from "components/smooth-scroll-provider";
import { getCart } from "lib/shopify";
import { Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { baseUrl } from "lib/utils";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "ATHELES - Authentic Superiority",
    template: `%s | ATHELES`,
  },
  description:
    "Greek god inspired athletic wear. Premium fitness and lifestyle clothing crafted for authentic superiority.",
  robots: {
    follow: true,
    index: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cart = getCart();

  return (
    <html lang="en" className={`dark ${playfair.variable}`} style={{ colorScheme: "dark" }}>
      <body className="bg-brand-dark text-white">
        <SmoothScrollProvider>
          <CartProvider cartPromise={cart}>
            <CustomCursor />
            <ScrollProgress />
            <KonamiLightning />
            <Navbar />
            <main className="w-full overflow-x-hidden">
              <PageTransition>
                {children}
              </PageTransition>
              <Toaster closeButton />
            </main>
          </CartProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
