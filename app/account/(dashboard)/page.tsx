import Link from "next/link";
import { FadeIn } from "components/animations";

export default function AccountDashboard() {
  return (
    <div>
      <FadeIn direction="up">
      <h2 className="mb-6 font-heading text-2xl text-brand-light-gold">
        my orders
      </h2>

      {/* Empty orders state */}
      <div className="mb-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-dark-gold/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-brand-grey/60">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
        <p className="mb-1 text-sm text-brand-pale-gold">no orders yet.</p>
        <p className="mb-5 text-xs text-brand-grey">
          your order history will appear here once you make a purchase.
        </p>
        <a
          href="/search"
          className="inline-block rounded-full bg-brand-gold px-6 py-2.5 text-sm uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90"
        >
          start shopping
        </a>
      </div>

      {/* Delivery info */}
      <div className="mb-6">
        <h3 className="mb-4 font-heading text-lg text-brand-pale-gold">
          delivery information
        </h3>
        <div className="space-y-3">
          <InfoCard
            title="expected delivery"
            description="standard shipping takes 5–10 business days. express options available at checkout depending on your region."
          />
          <InfoCard
            title="how do i track my order?"
            description="once your order ships, you'll receive a confirmation email with a tracking link. you can also check your order status here."
            link={{ href: "/account/order-help", label: "order help" }}
          />
          <InfoCard
            title="i want to change my order or address"
            description="contact us as soon as possible at athelesbrand@gmail.com. we can only make changes before the order has been dispatched."
          />
          <InfoCard
            title="customs and import fees"
            description="international orders may be subject to customs duties and taxes. these are determined by your local customs office and are the responsibility of the recipient."
          />
        </div>
      </div>

      {/* Problem section */}
      <div>
        <h3 className="mb-4 font-heading text-lg text-brand-pale-gold">
          need help with an order?
        </h3>
        <div className="space-y-3">
          <InfoCard
            title="problem with your order?"
            description="if something arrived damaged, incorrect, or didn't show up — reach out to us and we'll sort it out."
            link={{ href: "/contact", label: "contact us" }}
          />
          <InfoCard
            title="returns & exchanges"
            description="check our returns policy for details on how to return or exchange an item."
            link={{ href: "/returns", label: "view policy" }}
          />
        </div>
      </div>
      </FadeIn>
    </div>
  );
}

function InfoCard({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-5 py-4">
      <h4 className="mb-1.5 text-sm font-medium text-white">{title}</h4>
      <p className="text-xs leading-relaxed text-brand-grey">{description}</p>
      {link && (
        <Link
          href={link.href}
          className="mt-2 inline-block text-xs uppercase tracking-wider text-brand-gold transition-colors hover:text-brand-pale-gold"
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}
