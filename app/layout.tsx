import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnnouncementBar } from "components/announcement-bar";
import { CartProvider } from "components/cart/cart-context";
import { ThemeBackgroundCanvas } from "components/canvas-loader";
import { CurrencyProvider } from "components/currency-context";
import { KonamiLightning } from "components/easter-eggs/konami-lightning";
import { Navbar } from "components/layout/navbar";
import { PageTransition } from "components/page-transition";
import { ColorModeApplier } from "components/color-mode-applier";
import { headers } from "next/headers";
import { ProfileBackgroundApplier } from "components/profile-background-applier";
import { ScrollProgress } from "components/scroll-progress";
import { SelfLinkScroll } from "components/self-link-scroll";
import { SiteImagesProvider } from "components/site-images-context";
import { SiteThemeProvider } from "components/site-theme-provider";
import { getAnnouncementsData } from "lib/announcements-server";
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
  display: "optional",
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
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/icon-32.png",
  },
  appleWebApp: {
    capable: true,
    title: "atheles",
    statusBarStyle: "black-translucent",
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
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isComingSoon = pathname === "/coming-soon";

  const [siteImages, announcements] = await Promise.all([
    getSiteImagesData(),
    isComingSoon ? Promise.resolve([]) : getAnnouncementsData(),
  ]);

  return (
    <html
      lang="en"
      data-color-mode="dark"
      className={`dark ${playfair.variable}`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="bg-brand-dark text-white isolate">
        {/* Inline scripts run synchronously before React hydrates — prevents
            flashing between SSR paint and client hydration.                  */}
        {/* Color mode: apply before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{
              var _cm=localStorage.getItem("atheles-color-mode");
              var _eff="dark";
              if(window.innerWidth<1024){
                if(_cm==="light"){_eff="light";}
                else if(_cm==="system"){_eff=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";}
              }
              document.documentElement.setAttribute("data-color-mode",_eff);
              if(_eff==="light"){document.documentElement.style.colorScheme="light";}
            }catch(e){}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{
              var r=document.documentElement;
              var _isLt=r.getAttribute("data-color-mode")==="light";
              if(_isLt){
                r.style.setProperty("--color-brand-gold","#6e5214");r.style.setProperty("--color-brand-dark-gold","#7a5e18");
                r.style.setProperty("--color-brand-pale-gold","#614a12");r.style.setProperty("--color-brand-light-gold","#8a6a20");
                r.style.setProperty("--color-brand-dark","#e8dfc9");r.style.setProperty("--color-brand-grey","#4a4030");
                r.style.setProperty("--color-brand-medium-grey","#6a6058");r.style.setProperty("--color-brand-gold-wash","#7a6228");
              } else {
                var st=localStorage.getItem("atheles-site-theme");
                if(st){
                  var th=JSON.parse(st);
                  if(th.brandGold){r.style.setProperty("--color-brand-gold",th.brandGold);r.style.setProperty("--color-brand-dark-gold",th.brandDarkGold);r.style.setProperty("--color-brand-dark",th.brandDark)}
                  if(th.headingStyle==="gradient"&&th.headingGradientFrom){
                    var gs=document.createElement("style");gs.id="atheles-heading-gradient";
                    gs.textContent=".text-brand-gold,.text-brand-dark-gold,.text-brand-pale-gold,.text-brand-light-gold{background:linear-gradient(90deg,"+th.headingGradientFrom+","+th.headingGradientTo+") !important;-webkit-background-clip:text !important;-webkit-text-fill-color:transparent !important;background-clip:text !important}.text-brand-dark-gold{background:linear-gradient(90deg,"+th.headingGradientFrom+"99,"+th.headingGradientTo+"99) !important}";
                    document.head.appendChild(gs)
                  }
                }
              }
            }catch(e){}`,
          }}
        />
        {/* Profile background flash-prevention: reads localStorage so it
            persists across browser close/reopen (sessionStorage does not).  */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{
              var _bg=localStorage.getItem("atheles-bg-theme");
              if(_bg){
                var _bgd=JSON.parse(_bg);
                var _t=_bgd.theme;var _g=_bgd.globalTheme;
                var _p=window.location.pathname;
                if(_t&&_t!=="none"&&(_g||_p.startsWith("/profile"))){
                  document.body.setAttribute("data-bg",_t);
                }
              }
            }catch(e){}`,
          }}
        />
        <SiteImagesProvider data={siteImages}>
          <CurrencyProvider>
            <CartProvider cartPromise={cart}>
              <SelfLinkScroll />
              <SiteThemeProvider />
              <ColorModeApplier />
              <ProfileBackgroundApplier />
              <ThemeBackgroundCanvas />
              <KonamiLightning />
              <div id="thunder-shake-root">
                {!isComingSoon && <AnnouncementBar initialAnnouncements={announcements} />}
                {!isComingSoon && <Navbar />}
                <main className="relative z-[1] w-full">
                  <PageTransition>{children}</PageTransition>
                  <Toaster closeButton />
                </main>
              </div>
            </CartProvider>
          </CurrencyProvider>
        </SiteImagesProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
