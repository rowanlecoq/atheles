import Link from "next/link";

export default function OrderHelpPage() {
  return (
    <div>
      <h2 className="mb-6 font-heading text-2xl text-brand-light-gold">
        order help
      </h2>

      <div className="space-y-3">
        <HelpItem
          question="where is my order?"
          answer="once your order ships, you'll receive a tracking email. delivery typically takes 5–10 business days for standard shipping. if it's been longer than expected, reach out to us."
        />
        <HelpItem
          question="can i cancel or change my order?"
          answer="we process orders quickly. if you need to cancel or make changes, contact us at athelesbrand@gmail.com as soon as possible. once an order has shipped, we cannot modify it."
        />
        <HelpItem
          question="my order arrived damaged or incorrect"
          answer="we're sorry about that. please contact us with your order number and photos of the issue. we'll make it right with a replacement or refund."
        />
        <HelpItem
          question="do you ship internationally?"
          answer="yes, we ship worldwide. international orders may be subject to customs duties and import taxes, which are the responsibility of the recipient."
        />
        <HelpItem
          question="how long does shipping take?"
          answer="standard shipping: 5–10 business days. express shipping options are available at checkout depending on your location."
        />
        <HelpItem
          question="what is your return policy?"
          answer="we accept returns within 30 days of delivery for unworn items in original condition with tags attached."
          link={{ href: "/returns", label: "view full return policy" }}
        />
        <HelpItem
          question="i have another question"
          answer="we're here to help. send us a message and we'll get back to you as soon as possible."
          link={{ href: "/contact", label: "contact us" }}
        />
      </div>
    </div>
  );
}

function HelpItem({
  question,
  answer,
  link,
}: {
  question: string;
  answer: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark px-5 py-4">
      <h3 className="mb-1.5 text-sm font-medium text-white">{question}</h3>
      <p className="text-xs leading-relaxed text-brand-grey">{answer}</p>
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
