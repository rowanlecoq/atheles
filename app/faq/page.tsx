import Footer from "components/layout/footer";
import { FaqAccordion } from "./faq-accordion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about ATHELES products, sizing, shipping, returns, and more.",
};

const faqs = [
  {
    question: "What sizes do you offer?",
    answer:
      "We offer sizes XS through XL across all our product categories. Please refer to our Size Guide for detailed measurements for compressions, regular tops, oversized tops, and sweatpants.",
  },
  {
    question: "What materials do you use?",
    answer:
      "Our compressions are made from 80% Polyamide (Nylon) and 20% Spandex (Elastane) at 310 GSM. Regular tops and oversized tops use 100% Cotton at 350 GSM. Sweatpants are crafted from 90% Cotton, 7% Spandex, and 3% Steel Micro at 450 GSM. All materials are chosen for durability, comfort, and performance.",
  },
  {
    question: "How do your compression tops fit?",
    answer:
      "Our compressions are designed with a medium-high compression level — snug and athletic, body-contouring but breathable. They feature 4-way stretch performance fabric and are engineered for shoulder definition and an hourglass shape. If you're between sizes, we recommend sizing up.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We accept returns within 30 days of delivery for unworn, unwashed items with original tags attached. Items must be in original condition. Please visit our Returns page for full details.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Standard shipping typically takes 5-7 business days within the US. International shipping varies by destination, usually 10-14 business days. Expedited options are available at checkout.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship worldwide. International customers may be subject to import duties and taxes, which are the responsibility of the recipient. Shipping costs are calculated at checkout.",
  },
  {
    question: "How should I care for my ATHELES garments?",
    answer:
      "For compressions: Machine wash warm or cold, tumble dry warm. Do not bleach, iron, or dry clean. For cotton items: Machine wash cold, hang dry or tumble dry low. Turn garments inside out before washing to preserve prints and finishes.",
  },
  {
    question: "Are your colors achieved with metallic finishes?",
    answer:
      "No. All color effects in our garments are achieved through fabric dye and pigment only. We do not use metallic, foil, or glossy finishes. This ensures lasting color and a premium feel.",
  },
  {
    question: "When are you launching?",
    answer:
      "ATHELES is launching on May 6, 2026. Sign up for our newsletter to be the first to know when we go live and to receive exclusive early access.",
  },
  {
    question: "How can I collaborate with ATHELES?",
    answer:
      "We're always open to collaborations with athletes, creators, and brands that share our vision. Please reach out via our Contact page with details about your proposal.",
  },
];

export default function FaqPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-heading text-4xl text-brand-gold sm:text-5xl">
            FAQ
          </h1>
          <p className="text-sm text-brand-grey">
            Everything you need to know about ATHELES.
          </p>
        </div>
        <FaqAccordion faqs={faqs} />
        <div className="mt-12 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8 text-center">
          <h2 className="mb-2 font-heading text-lg text-brand-gold sm:text-xl">
            Still Have Questions?
          </h2>
          <p className="mb-4 text-sm text-brand-grey">
            Can&apos;t find the answer you&apos;re looking for? We&apos;re here
            to help.
          </p>
          <a
            href="/contact"
            className="inline-block rounded bg-brand-gold px-6 py-2.5 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold"
          >
            Contact Us
          </a>
        </div>
      </div>
      <Footer />
    </>
  );
}
