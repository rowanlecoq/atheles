import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "returns policy",
  description:
    "ATHELES returns and exchange policy. Learn about our 30-day return window and process.",
};

export default function ReturnsPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <h1 className="mb-8 text-balance font-heading text-4xl leading-tight text-brand-gold sm:text-5xl">
          Returns &amp; Exchanges
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-brand-grey">
          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              Return Policy
            </h2>
            <p>
              We want you to love your ATHELES gear. If you&apos;re not
              completely satisfied, we accept returns within{" "}
              <strong className="text-brand-pale-gold">
                30 days of delivery
              </strong>{" "}
              for a full refund to your original payment method.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              Return Conditions
            </h2>
            <ul className="ml-4 list-disc space-y-2">
              <li>Items must be unworn, unwashed, and in original condition</li>
              <li>All original tags must be attached</li>
              <li>Items must be in original packaging</li>
              <li>Sale items are final sale and cannot be returned</li>
              <li>
                Undergarments and swimwear cannot be returned for hygiene
                reasons
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              How to Return
            </h2>
            <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
              <ol className="ml-4 list-decimal space-y-3">
                <li>
                  Contact us at{" "}
                  <a
                    href="mailto:athelesbrand@gmail.com"
                    className="text-brand-gold underline underline-offset-4"
                  >
                    athelesbrand@gmail.com
                  </a>{" "}
                  with your order number and reason for return
                </li>
                <li>
                  We will provide you with a return shipping label and
                  instructions
                </li>
                <li>Pack the item(s) securely in the original packaging</li>
                <li>Ship the package using the provided label</li>
                <li>
                  Once we receive and inspect the return, your refund will be
                  processed within 5-7 business days
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              Exchanges
            </h2>
            <p>
              Need a different size? We offer free exchanges on all full-price
              items. Simply initiate a return and place a new order for the
              desired size. For the fastest service, we recommend placing a new
              order immediately and returning the original item.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              Damaged or Defective Items
            </h2>
            <p>
              If you receive a damaged or defective item, please contact us
              within 48 hours of delivery with photos of the issue. We will
              arrange a replacement or full refund at no additional cost.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-brand-light-gold sm:text-xl">
              Refund Timeline
            </h2>
            <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
              <div className="space-y-3">
                <div className="flex flex-col gap-1 border-b border-brand-dark-gold/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-brand-pale-gold">Return received</span>
                  <span>1-2 business days inspection</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-brand-dark-gold/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-brand-pale-gold">Refund processed</span>
                  <span>3-5 business days</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-brand-pale-gold">Funds returned</span>
                  <span>5-10 business days (varies by bank)</span>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6 text-center">
            <p className="text-brand-grey">
              Need help with a return?{" "}
              <a
                href="/contact"
                className="text-brand-gold underline underline-offset-4 hover:text-brand-light-gold"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
