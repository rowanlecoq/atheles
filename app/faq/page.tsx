import Footer from "components/layout/footer";
import { FaqAccordion } from "./faq-accordion";
import { FadeIn } from "components/animations";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "faq",
  description:
    "frequently asked questions about atheles products, sizing, shipping, returns, and more.",
};

const sections = [
  {
    label: "sizes.",
    faqs: [
      {
        question: "what sizes do you offer?",
        answer:
          "we offer sizes xs through xl across all our product categories. please refer to our size guide for detailed measurements for compressions, regular tops, oversized tops, and sweatpants.",
      },
    ],
  },
  {
    label: "orders, returns & shipping.",
    faqs: [
      {
        question: "what is your return policy?",
        answer:
          "we accept returns within 30 days of delivery for unworn, unwashed items with original tags attached. items must be in original condition. please visit our returns page for full details.",
      },
      {
        question: "how long does shipping take?",
        answer:
          "standard shipping typically takes 5–7 business days within the us. international shipping varies by destination, usually 10–14 business days. expedited options are available at checkout.",
      },
      {
        question: "do you ship internationally?",
        answer:
          "yes, we ship worldwide. international customers may be subject to import duties and taxes, which are the responsibility of the recipient. shipping costs are calculated at checkout.",
      },
    ],
  },
  {
    label: "work with us.",
    faqs: [
      {
        question: "how can i collaborate with atheles?",
        answer:
          "we're always open to collaborations with creators, brands, and athletes that share our vision. reach out via our contact page with details about your proposal and we'll get back to you.",
      },
      {
        question: "how do i become an ambassador?",
        answer:
          "we're looking for passionate individuals who embody the atheles lifestyle. to apply, reach out through our contact page with your social media profiles and a brief introduction about yourself and your fitness journey. we look for authentic voices who align with our values — no formal athlete background required.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <FadeIn direction="up">
          <div className="mb-12 text-center">
            <h1 className="mb-4 font-heading text-4xl text-brand-gold sm:text-5xl">
              faq.
            </h1>
            <p className="text-sm text-brand-grey">
              everything you need to know about atheles.
            </p>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.05}>
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="mb-3 text-xs uppercase tracking-[0.18em] text-brand-dark-gold/70">
                  {section.label}
                </p>
                <FaqAccordion faqs={section.faqs} />
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8 text-center">
            <h2 className="mb-2 font-heading text-lg text-brand-gold sm:text-xl">
              still have questions?
            </h2>
            <p className="mb-4 text-sm text-brand-grey">
              can&apos;t find the answer you&apos;re looking for? we&apos;re
              here to help.
            </p>
            <a
              href="/contact"
              className="inline-block border border-brand-gold px-8 py-3 text-xs uppercase tracking-[0.18em] text-brand-gold transition-colors duration-300 hover:bg-brand-gold hover:text-brand-dark"
            >
              contact us
            </a>
          </div>
        </FadeIn>
      </div>
      <Footer />
    </>
  );
}
