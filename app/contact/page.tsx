import Footer from "components/layout/footer";
import { ContactForm } from "./contact-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with ATHELES. We'd love to hear from you about orders, collaborations, or general inquiries.",
};

export default function ContactPage() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-balance font-heading text-4xl text-brand-gold sm:text-5xl">
            Contact Us
          </h1>
          <p className="text-sm text-brand-grey">
            Have a question, feedback, or collaboration inquiry? We&apos;d love
            to hear from you.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          {/* Contact Form */}
          <div>
            <h2 className="mb-6 font-heading text-lg text-brand-light-gold sm:text-xl">
              Send a Message
            </h2>
            <ContactForm />
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="mb-6 font-heading text-lg text-brand-light-gold sm:text-xl">
              Get in Touch
            </h2>
            <div className="space-y-6">
              <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
                <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-brand-gold sm:tracking-wider">
                  Email
                </h3>
                <a
                  href="mailto:contact@atheles.co"
                  className="break-all text-sm text-brand-grey transition-colors hover:text-brand-gold"
                >
                  contact@atheles.co
                </a>
              </div>
              <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
                <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-brand-gold sm:tracking-wider">
                  Social
                </h3>
                <div className="space-y-2">
                  <a
                    href="https://www.instagram.com/atheles.co/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-brand-grey transition-colors hover:text-brand-gold"
                  >
                    Instagram: @atheles.co
                  </a>
                </div>
              </div>
              <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
                <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-brand-gold sm:tracking-wider">
                  Response Time
                </h3>
                <p className="text-sm text-brand-grey">
                  We typically respond within 24-48 hours during business days.
                </p>
              </div>
              <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5">
                <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-brand-gold sm:tracking-wider">
                  Business Inquiries
                </h3>
                <p className="text-sm text-brand-grey">
                  For wholesale, partnerships, or press inquiries, please email
                  us directly with the subject line &ldquo;Business
                  Inquiry&rdquo;.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
