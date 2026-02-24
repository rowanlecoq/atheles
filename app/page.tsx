import { BrandStory } from "components/brand-story";
import { Carousel } from "components/carousel";
import { GreekQuote } from "components/greek-quote";
import { ThreeItemGrid } from "components/grid/three-items";
import { Hero } from "components/hero";
import Footer from "components/layout/footer";
import { NewsletterSignup } from "components/newsletter-signup";
import { StatueInterstitial } from "components/statue-interstitial";

export const metadata = {
  description:
    "Greek god inspired athletic wear. Premium fitness and lifestyle clothing crafted for authentic superiority. Opening 5.6.26.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ThreeItemGrid />
      <StatueInterstitial />
      <BrandStory />
      <Carousel />
      <NewsletterSignup />
      <GreekQuote />
      <Footer />
    </>
  );
}
