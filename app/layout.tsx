import { Analytics } from "@vercel/analytics/next";
import { AnnouncementBar } from "components/announcement-bar";
import { CartProvider } from "components/cart/cart-context";
import { CurrencyProvider } from "components/currency-context";
import { KonamiLightning } from "components/easter-eggs/konami-lightning";
import { Navbar } from "components/layout/navbar";
import { PageTransition } from "components/page-transition";
import { ScrollProgress } from "components/scroll-progress";
import { SiteThemeProvider } from "components/site-theme-provider";
import { ThemeBackground } from "components/theme-background";
import { getCart } from "lib/shopify";
import { SiteImagesProvider } from "components/site-images-context";
import { getSiteImagesData } from "lib/site-images-server";
import { getSiteThemeData, generateThemeCSS } from "lib/site-theme-server";
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
    icon: "/logocircular.png",
    apple: "/logocircular.png",
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
  const [siteImages, siteTheme] = await Promise.all([
    getSiteImagesData(),
    getSiteThemeData(),
  ]);

  return (
    <html
      lang="en"
      className={`dark ${playfair.variable}`}
      style={{ colorScheme: "dark" }}
    >
      <body className="bg-brand-dark text-white" style={{ backgroundColor: siteTheme.brandDark }}>
        {/* Inject theme CSS + per-user overrides before any content renders */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{
              var css=${JSON.stringify(generateThemeCSS(siteTheme))};
              var s=document.createElement("style");s.id="atheles-server-theme";s.textContent=css;document.head.appendChild(s);
              var ss=sessionStorage.getItem("atheles-session");
              if(ss&&document.cookie.includes("atheles-logged-in=1")){
                var u=JSON.parse(ss),t=u.theme;
                if(t&&t!=="none"){document.body.setAttribute("data-theme",t);if(u.globalTheme)document.body.setAttribute("data-theme-global","1")}
              }
            }catch(e){}`,
          }}
        />
        <SiteImagesProvider data={siteImages}>
          <CurrencyProvider>
            <CartProvider cartPromise={cart}>
              <SiteThemeProvider />
              <AnnouncementBar />
              <ScrollProgress />
              <KonamiLightning />
              <Navbar />
              <ThemeBackground />
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
