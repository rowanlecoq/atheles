import { Analytics } from "@vercel/analytics/next";
import { AnnouncementBar } from "components/announcement-bar";
import { CartProvider } from "components/cart/cart-context";
import { CurrencyProvider } from "components/currency-context";
import { KonamiLightning } from "components/easter-eggs/konami-lightning";
import { Navbar } from "components/layout/navbar";
import { SparkleBackground } from "components/sparkle-background";
import { PageTransition } from "components/page-transition";
import { ScrollProgress } from "components/scroll-progress";
import { SiteImagesProvider } from "components/site-images-context";
import { SiteThemeProvider } from "components/site-theme-provider";
import { getCart } from "lib/shopify";
import { getSiteImagesData } from "lib/site-images-server";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { baseUrl } from "lib/utils";

const playfair = localFont({
  src: "../public/fonts/PlayfairDisplay-Variable.ttf",
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "atheles: official store 🔱 TO ASCEND.",
    template: `%s | atheles 🔱`,
  },
  description:
    "the new era of gymwear and streetwear. unlock your fullest potential 🔱 craft your aesthetic.",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/icon-32.png",
  },
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
  const siteImages = await getSiteImagesData();

  return (
    <html
      lang="en"
      className={`dark ${playfair.variable}`}
      style={{ colorScheme: "dark" }}
    >
      <body className="bg-brand-dark text-white isolate">
        {/* Inline script to set theme colors before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{
              var st=sessionStorage.getItem("atheles-site-theme");
              if(st){
                var th=JSON.parse(st),r=document.documentElement;
                if(th.brandGold){r.style.setProperty("--color-brand-gold",th.brandGold);r.style.setProperty("--color-brand-dark-gold",th.brandDarkGold);r.style.setProperty("--color-brand-dark",th.brandDark);document.body.style.backgroundColor=th.brandDark}
                if(th.headingStyle==="gradient"&&th.headingGradientFrom){
                  var gs=document.createElement("style");gs.id="atheles-heading-gradient";
                  gs.textContent=".text-brand-gold,.text-brand-dark-gold,.text-brand-pale-gold,.text-brand-light-gold{background:linear-gradient(90deg,"+th.headingGradientFrom+","+th.headingGradientTo+") !important;-webkit-background-clip:text !important;-webkit-text-fill-color:transparent !important;background-clip:text !important}.text-brand-dark-gold{background:linear-gradient(90deg,"+th.headingGradientFrom+"99,"+th.headingGradientTo+"99) !important}";
                  document.head.appendChild(gs)
                }
              }
            }catch(e){}`,
          }}
        />
        {/* Sparkle layer: direct child of body so z-index:-1 is in the root
            stacking context — strictly behind all page content */}
        <SparkleBackground />
        <SiteImagesProvider data={siteImages}>
          <CurrencyProvider>
            <CartProvider cartPromise={cart}>
              <SiteThemeProvider />
              <AnnouncementBar />
              <ScrollProgress />
              <KonamiLightning />
              <Navbar />
              <main className="relative z-[1] w-full">
                <PageTransition>{children}</PageTransition>
                <Toaster closeButton />
              </main>
            </CartProvider>
          </CurrencyProvider>
        </SiteImagesProvider>
        <Analytics />
      </body>
    </html>
  );
}
