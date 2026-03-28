import { Carousel } from "components/carousel";
import { GreekQuote } from "components/greek-quote";
import { ThreeItemGrid } from "components/grid/three-items";
import { Hero } from "components/hero";
import Footer from "components/layout/footer";
import { NewsletterSignup } from "components/newsletter-signup";

export const metadata = {
  description:
    "premium fitness and lifestyle clothing crafted for authentic superiority.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Carousel />
      <ThreeItemGrid />
      <NewsletterSignup />
      <GreekQuote />
      <Footer />
    </>
  );
}
