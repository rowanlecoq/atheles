import Footer from "components/layout/footer";
import { FadeIn } from "components/animations";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "shipping policy",
  description:
    "ATHELES shipping policy. Learn about our shipping methods, timeframes, and international delivery.",
};

export default function ShippingPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <FadeIn direction="up">
        <h1 className="mb-8 text-balance font-heading text-4xl leading-tight text-brand-gold sm:text-5xl">
          Shipping Policy
        </h1>
        </FadeIn>

        <FadeIn direction="up" delay={0.05}>
        <div className="space-y-8 text-sm leading-relaxed text-brand-grey">
          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              Domestic Shipping (United States)
            </h2>
            <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
              <div className="space-y-3">
                <div className="flex flex-col gap-1 border-b border-brand-dark-gold/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-brand-pale-gold">
                    Standard Shipping
                  </span>
                  <span>5-7 business days</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-brand-dark-gold/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-brand-pale-gold">
                    Expedited Shipping
                  </span>
                  <span>2-3 business days</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-brand-pale-gold">Express Shipping</span>
                  <span>1-2 business days</span>
                </div>
              </div>
            </div>
            <p className="mt-4">
              Free standard shipping is available on all orders over $100.
              Shipping costs are calculated at checkout based on your location
              and selected shipping method.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              International Shipping
            </h2>
            <p>
              We ship worldwide. International shipping typically takes 10-14
              business days depending on the destination. Delivery times may
              vary based on customs processing in your country.
            </p>
            <p className="mt-3">
              <strong className="text-brand-pale-gold">
                Duties &amp; Taxes:
              </strong>{" "}
              International orders may be subject to import duties, taxes, and
              customs fees. These charges are the responsibility of the
              recipient and are not included in the order total.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              Order Processing
            </h2>
            <p>
              Orders are processed within 1-2 business days. You will receive a
              confirmation email with tracking information once your order has
              shipped. Orders placed on weekends or holidays will be processed
              the next business day.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              Tracking Your Order
            </h2>
            <p>
              Once your order ships, you will receive an email with a tracking
              number. You can use this number to track your package on the
              carrier&apos;s website. If you have any issues with tracking,
              please contact us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              Shipping Restrictions
            </h2>
            <p>
              We currently ship to most countries worldwide. However, some
              regions may have restrictions. If your country is not available at
              checkout, please contact us and we will do our best to accommodate
              your order.
            </p>
          </section>

          <div className="mt-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6 text-center">
            <p className="text-brand-grey">
              Have a question about shipping?{" "}
              <a
                href="/contact"
                className="text-brand-gold underline underline-offset-4 hover:text-brand-light-gold"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
        </FadeIn>
      </div>
      <Footer />
    </>
  );
}
