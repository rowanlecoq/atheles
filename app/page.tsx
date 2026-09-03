import { Carousel } from "components/carousel";
import { GreekQuote } from "components/greek-quote";
import { ThreeItemGrid } from "components/grid/three-items";
import { Hero } from "components/hero";
import Footer from "components/layout/footer";
import { NewsletterSignup } from "components/newsletter-signup";
import { ReviewSideTab } from "components/reviews-gallery";
import { Suspense } from "react";

export const metadata = {
  description:
    "the new era of gymwear and streetwear. unlock your fullest potential 🔱 craft your aesthetic.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <ReviewSideTab />
      <Hero />
      <Suspense fallback={null}>
        <Carousel />
      </Suspense>
      <Suspense fallback={null}>
        <ThreeItemGrid />
      </Suspense>
      <NewsletterSignup />
      <GreekQuote />
      <Footer />
    </>
  );
}
